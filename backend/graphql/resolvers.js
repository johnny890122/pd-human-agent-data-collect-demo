import { connectToDatabase, isDbConfigured } from '../db.js';
import { SubmissionModel } from '../models/Submission.js';
import { ScenarioModel } from '../models/Scenario.js';
import { SessionModel } from '../models/Session.js';
import { SessionGroupModel } from '../models/SessionGroup.js';
import GraphQLJSON from 'graphql-type-json';
import { randomUUID } from 'crypto';
import { generateEdgeCombinations } from '../../utils/combinations.js';
import { generateDesignMatrix } from '../../utils/mathBackend.js';
import { balancedSelect } from '../../utils/scenarioSelection.js';

function requireDb() {
  if (!isDbConfigured()) {
    throw new Error('MONGODB_URI is not configured. Set it in your environment to enable persistence.');
  }
}

// ============================================================================
// Helper Functions - New Data Model
// ============================================================================

async function toScenarioGraph(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    focalNode: doc.focalNode,
    opponentNode: doc.opponentNode,
    activeEdgeIds: doc.activeEdgeIds || [],
    edgeStates: doc.edgeStates || {},
    scenarioIndex: doc.scenarioIndex,
    groupId: doc.groupId || null,
    targetSize: doc.targetSize || 0,
    responseCount: doc.responseCount || 0,
    status: doc.status || 'active',
    completionRate: doc.completionRate || 0,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}

async function toSessionGraph(doc, populateScenarios = true) {
  if (!doc) return null;
  
  // 如果需要 populate scenarios
  let scenarios = [];
  if (populateScenarios && doc.scenarioIds && doc.scenarioIds.length > 0) {
    const scenarioDocs = await ScenarioModel.find({ _id: { $in: doc.scenarioIds } }).lean();
    scenarios = await Promise.all(scenarioDocs.map(s => toScenarioGraph(s)));
  }
  
  const submissionCount = await SubmissionModel.countDocuments({
    sessionId: String(doc._id),
    isCompleted: true,
    isInvalid: { $ne: true },
  });
  
  let activeEdgeIds = [];
  if (scenarios.length > 0) {
    activeEdgeIds = scenarios[0].activeEdgeIds || [];
  } else if (doc.scenarioIds && doc.scenarioIds.length > 0) {
    // If scenarios not populated, fetch just the first one's activeEdgeIds
    const firstScenario = await ScenarioModel.findById(doc.scenarioIds[0]).select('activeEdgeIds').lean();
    if (firstScenario) {
      activeEdgeIds = firstScenario.activeEdgeIds || [];
    }
  }
  
  return {
    _id: String(doc._id),
    scenarioIds: doc.scenarioIds || [],
    scenarios,
    activeEdgeIds, // Virtual field derived from scenarios for UI compatibility
    focalNode: doc.focalNode,
    opponentNode: doc.opponentNode,
    sampleSize: doc.sampleSize || 20,
    groupId: doc.groupId || null,
    submissionCount,
    metadata: doc.metadata || null,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}

function toGroupGraph(doc) {
  if (!doc) return null;
  
  // Mode 偵測
  let mode = 'manual';
  if (doc.config) {
    if (doc.config.maxK) mode = 'mixed';
    else if (doc.config.edgeCount) mode = 'batch';
  }
  
  return {
    _id: String(doc._id),
    name: doc.name,
    description: doc.description || null,
    config: doc.config || {},
    totalSessions: doc.totalSessions || 0,
    totalScenarios: doc.totalScenarios || 0,
    mode,
    completionPercentage: doc.completionPercentage || 0,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}

function toSubmissionGraph(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    sessionId: doc.sessionId,
    participantId: doc.participantId || null,
    results: doc.results || [],
    demographics: doc.demographics || null,
    isCompleted: doc.isCompleted === true,
    completedAt: doc.completedAt ? (doc.completedAt instanceof Date ? doc.completedAt.toISOString() : doc.completedAt) : null,
    isInvalid: doc.isInvalid === true,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}

// ============================================================================
// Resolvers
// ============================================================================

export const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    health: () => 'ok',
    
    // ========================================================================
    // Session Queries (NEW)
    // ========================================================================
    
    session: async (_, { id }) => {
      requireDb();
      await connectToDatabase();
      const doc = await SessionModel.findById(id).lean();
      return await toSessionGraph(doc);
    },
    
    allSessions: async (_, { excludeGroupSessions = false }) => {
      requireDb();
      await connectToDatabase();
      
      const query = excludeGroupSessions ? { groupId: null } : {};
      const docs = await SessionModel.find(query).sort({ createdAt: -1 }).lean();
      return await Promise.all(docs.map(doc => toSessionGraph(doc)));
    },
    
    sessionsByGroup: async (_, { groupId }) => {
      requireDb();
      await connectToDatabase();
      const docs = await SessionModel.find({ groupId }).sort({ createdAt: 1 }).lean();
      return await Promise.all(docs.map(doc => toSessionGraph(doc)));
    },
    
    activeSession: async () => {
      requireDb();
      await connectToDatabase();
      const doc = await SessionModel.findOne().sort({ updatedAt: -1 }).lean();
      return await toSessionGraph(doc);
    },
    
    findUserSession: async (_, { groupId, participantId }) => {
      requireDb();
      await connectToDatabase();
      
      if (!participantId) {
        return null;
      }
      
      const doc = await SessionModel.findOne({
        groupId,
        'metadata.participantId': participantId,
      }).lean();
      
      return doc ? await toSessionGraph(doc) : null;
    },
    
    // ========================================================================
    // Scenario Queries (NEW)
    // ========================================================================
    
    scenario: async (_, { id }) => {
      requireDb();
      await connectToDatabase();
      const doc = await ScenarioModel.findById(id).lean();
      return await toScenarioGraph(doc);
    },
    
    scenarios: async (_, { groupId, status, limit, ids }) => {
      requireDb();
      await connectToDatabase();
      
      const query = {};
      
      // If ids provided, use $in query (takes precedence over other filters)
      if (ids && ids.length > 0) {
        query._id = { $in: ids };
      } else {
        // Otherwise apply standard filters
        if (groupId) query.groupId = groupId;
        if (status) query.status = status;
      }
      
      let queryBuilder = ScenarioModel.find(query).sort({ createdAt: 1 });
      if (limit) queryBuilder = queryBuilder.limit(limit);
      
      const docs = await queryBuilder.lean();
      return await Promise.all(docs.map(doc => toScenarioGraph(doc)));
    },
    
    // ========================================================================
    // SessionGroup Queries
    // ========================================================================
    
    sessionGroup: async (_, { id }) => {
      requireDb();
      await connectToDatabase();
      const doc = await SessionGroupModel.findById(id).lean();
      return toGroupGraph(doc);
    },
    
    allSessionGroups: async () => {
      requireDb();
      await connectToDatabase();
      const docs = await SessionGroupModel.find({}).sort({ createdAt: -1 }).lean();
      return docs.map(doc => toGroupGraph(doc));
    },
    
    // ========================================================================
    // Submission Queries
    // ========================================================================
    
    recentSubmissions: async (_, { limit = 20 }) => {
      requireDb();
      await connectToDatabase();
      const docs = await SubmissionModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return docs.map(doc => toSubmissionGraph(doc));
    },
    
    // Session replay resolver removed per REQ-413
    
  },

  Mutation: {
    // ========================================================================
    // Mode 1: Manual Session (NEW)
    // ========================================================================
    
    createManualSession: async (_, { input }) => {
      requireDb();
      await connectToDatabase();
      
      const { activeEdgeIds, focalNode, opponentNode, sampleSize } = input;
      
      // Validation: activeEdgeIds must not be empty
      if (!activeEdgeIds || activeEdgeIds.length === 0) {
        throw new Error('activeEdgeIds cannot be empty. At least one edge must be selected.');
      }
      
      // Validation: basic field checks
      if (!focalNode || !opponentNode) {
        throw new Error('focalNode and opponentNode are required.');
      }
      
      if (!sampleSize || sampleSize < 1) {
        throw new Error('sampleSize must be at least 1.');
      }
      
      // 1. 生成 design matrix
      const designMatrix = generateDesignMatrix(activeEdgeIds);
      console.log(`[createManualSession] Generated ${designMatrix.length} scenarios`);
      
      // 2. 建立獨立的 Scenario documents
      const scenarioDocs = designMatrix.map((scenario, index) => ({
        _id: randomUUID(),
        focalNode,
        opponentNode,
        activeEdgeIds,
        edgeStates: scenario.edgeStates,
        scenarioIndex: index,
        groupId: null,
        targetSize: 0,  // Manual mode 不追蹤 scenario-level
        responseCount: 0,
        status: 'active',
      }));
      
      console.log(`[createManualSession] Inserting ${scenarioDocs.length} Scenario documents...`);
      const scenarios = await ScenarioModel.insertMany(scenarioDocs);
      console.log(`[createManualSession] ✓ Inserted ${scenarios.length} Scenarios`);
      console.log(`[createManualSession] Scenario IDs:`, scenarios.map(s => s._id));
      
      // 3. 建立 Session 引用 scenarios
      console.log(`[createManualSession] Creating Session document...`);
      const session = await SessionModel.create({
        _id: randomUUID(),
        scenarioIds: scenarios.map(s => s._id),
        focalNode,
        opponentNode,
        sampleSize,
        groupId: null,
        submissionCount: 0,
        metadata: { createdFor: 'manual' },
      });
      console.log(`[createManualSession] ✓ Created Session: ${session._id}`);
      
      const result = {
        session: await toSessionGraph(session.toObject()),
        scenariosCreated: scenarios.length,
      };
      console.log(`[createManualSession] Returning result with ${result.scenariosCreated} scenarios`);
      
      return result;
    },
    
    // ========================================================================
    // Mode 3: Mixed Mode (NEW)
    // ========================================================================
    
    createMixedGroup: async (_, { input, name, description }) => {
      requireDb();
      await connectToDatabase();
      
      const { maxK, scenariosPerSession, targetSizePerScenario, focalNode, opponentNode } = input;
      
      // 驗證參數
      if (!maxK || maxK < 1 || maxK > 12) {
        throw new Error('maxK must be between 1 and 12');
      }
      
      if (!scenariosPerSession || scenariosPerSession < 1) {
        throw new Error('scenariosPerSession must be at least 1');
      }
      
      if (!targetSizePerScenario || targetSizePerScenario < 1) {
        throw new Error('targetSizePerScenario must be at least 1');
      }
      
      console.log(`[createMixedGroup] Creating Mixed Mode group: maxK=${maxK}, scenariosPerSession=${scenariosPerSession}, targetSize=${targetSizePerScenario}`);
      
      // 1. 建立 SessionGroup
      const group = await SessionGroupModel.create({
        _id: randomUUID(),
        name,
        description: description || null,
        config: {
          maxK,
          scenariosPerSession,
          targetSizePerScenario,
          focalNode,
          opponentNode,
          sampleSize: 1, // Mixed mode: 每個 session 一個參與者
        },
        totalSessions: 0, // 動態創建，初始為 0
        totalScenarios: 0, // 稍後更新
      });
      
      const groupId = String(group._id);
      
      // 2. 生成 scenario pool: 所有 k=1..maxK 的組合
      const allEdges = [
        { id: 'KMT1-KMT2' }, { id: 'KMT1-DPP3' }, { id: 'KMT1-DPP4' },
        { id: 'KMT2-KMT1' }, { id: 'KMT2-DPP3' }, { id: 'KMT2-DPP4' },
        { id: 'DPP3-KMT1' }, { id: 'DPP3-KMT2' }, { id: 'DPP3-DPP4' },
        { id: 'DPP4-KMT1' }, { id: 'DPP4-KMT2' }, { id: 'DPP4-DPP3' },
      ];
      
      const scenariosPool = [];
      
      for (let k = 1; k <= maxK; k++) {
        const combinations = generateEdgeCombinations(allEdges, k);
        console.log(`[createMixedGroup] k=${k}: ${combinations.length} combinations`);
        
        for (const combo of combinations) {
          const designMatrix = generateDesignMatrix(combo);
          
          for (let index = 0; index < designMatrix.length; index++) {
            const scenario = designMatrix[index];
            scenariosPool.push({
              _id: randomUUID(),
              focalNode,
              opponentNode,
              activeEdgeIds: combo,
              edgeStates: scenario.edgeStates,
              scenarioIndex: index,
              groupId,
              targetSize: targetSizePerScenario,
              responseCount: 0,
              status: 'active',
            });
          }
        }
      }
      
      console.log(`[createMixedGroup] Generated ${scenariosPool.length} scenarios`);
      
      // 3. 批量插入 scenarios
      await ScenarioModel.insertMany(scenariosPool);
      console.log(`[createMixedGroup] ✓ Inserted ${scenariosPool.length} Scenario documents`);
      
      // 4. 更新 group 統計
      await SessionGroupModel.updateOne(
        { _id: groupId },
        {
          $set: {
            totalScenarios: scenariosPool.length
          }
        }
      );
      
      // 5. 估算需要多少參與者
      const estimatedSessions = Math.ceil(
        (scenariosPool.length * targetSizePerScenario) / scenariosPerSession
      );
      
      // 6. 生成 master URL
      const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const masterUrl = `${origin}/survey/welcome?groupId=${groupId}&mode=mixed`;
      
      console.log(`[createMixedGroup] ✓ Group created: ${groupId}`);
      console.log(`[createMixedGroup] Total scenarios: ${scenariosPool.length}`);
      console.log(`[createMixedGroup] Estimated sessions: ${estimatedSessions}`);
      console.log(`[createMixedGroup] Master URL: ${masterUrl}`);
      
      return {
        groupId,
        totalScenarios: scenariosPool.length,
        estimatedSessions,
        masterUrl,
      };
    },
    
    startMixedSession: async (_, { groupId, participantId }, context) => {
      if (!context?.isTurnstileVerified) {
        throw new Error('Turnstile verification required before starting survey.');
      }
      
      requireDb();
      await connectToDatabase();
      
      console.log(`[startMixedSession] Starting session for participant: ${participantId || 'anonymous'}`);
      
      // 1. 檢查 group 是否存在
      const group = await SessionGroupModel.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }
      
      const config = group.config || {};
      const scenariosPerSession = config.scenariosPerSession || 20;
      
      // 2. 檢查是否已有該參與者的 session (resume capability)
      if (participantId) {
        const existingSession = await SessionModel.findOne({
          groupId,
          'metadata.participantId': participantId,
        });
        
        if (existingSession) {
          console.log(`[startMixedSession] Found existing session: ${existingSession._id}`);
          
          // 返回現有 session 的 scenarios
          const scenarioDocs = await ScenarioModel.find({
            _id: { $in: existingSession.scenarioIds }
          }).lean();
          const scenarios = await Promise.all(scenarioDocs.map(s => toScenarioGraph(s)));
          
          return {
            sessionId: String(existingSession._id),
            assignedScenarios: scenarios,
          };
        }
      }
      
      // 3. 使用 balanced selection 策略選擇 scenarios
      console.log(`[startMixedSession] Selecting ${scenariosPerSession} scenarios...`);
      
      const candidateScenarios = await ScenarioModel
        .find({
          groupId,
          status: 'active'
        })
        .lean();
      
      console.log(`[startMixedSession] Found ${candidateScenarios.length} active scenarios`);
      
      if (candidateScenarios.length === 0) {
        throw new Error('No active scenarios available in this group');
      }
      
      // 使用 balanced selection 策略
      const selectedScenarioIds = balancedSelect(candidateScenarios, scenariosPerSession);
      
      if (selectedScenarioIds.length === 0) {
        throw new Error('Failed to select scenarios');
      }
      
      console.log(`[startMixedSession] Selected ${selectedScenarioIds.length} scenarios`);
      
      // 4. 建立個人 session
      const session = await SessionModel.create({
        _id: randomUUID(),
        scenarioIds: selectedScenarioIds,
        focalNode: config.focalNode,
        opponentNode: config.opponentNode,
        sampleSize: 1, // Mixed mode: 每個 session 只有一個參與者
        groupId,
        submissionCount: 0,
        metadata: {
          participantId: participantId || null,
          createdFor: 'mixed',
        },
      });
      
      console.log(`[startMixedSession] ✓ Created session: ${session._id}`);
      
      // 5. 更新 group 的 totalSessions
      await SessionGroupModel.updateOne(
        { _id: groupId },
        { $inc: { totalSessions: 1 } }
      );
      
      // 6. 返回 session 和分配的 scenarios
      const scenarioDocs = await ScenarioModel.find({
        _id: { $in: selectedScenarioIds }
      }).lean();
      const scenarios = await Promise.all(scenarioDocs.map(s => toScenarioGraph(s)));
      
      return {
        sessionId: String(session._id),
        assignedScenarios: scenarios,
      };
    },
    
    // ========================================================================
    // Unified Survey Flow (REFACTORED)
    // ========================================================================
    
    startSurvey: async (_, { sessionId, participantId }, context) => {
      if (!context?.isTurnstileVerified) {
        throw new Error('Turnstile verification required before starting survey.');
      }

      requireDb();
      await connectToDatabase();

      // 檢查 session 是否已滿
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const submissionCount = await SubmissionModel.countDocuments({
        sessionId,
        isCompleted: true,
        isInvalid: { $ne: true },
      });

      if (submissionCount >= session.sampleSize) {
        throw new Error('Session is full');
      }

      // REQ-313: 同一參與者不能對同一 session 重複提交 — 返回既有記錄以支援 resume
      if (participantId) {
        const existing = await SubmissionModel.findOne({ sessionId, participantId });
        if (existing) {
          return toSubmissionGraph(existing);
        }
      }

      // 建立 submission（記錄 participantId 供後續重複偵測使用）
      const doc = await SubmissionModel.create({
        sessionId,
        participantId: participantId || null,
        results: [],
        demographics: null,
        isCompleted: false,
      });

      return toSubmissionGraph(doc);
    },
    
    saveSurveyAnswer: async (_, { submissionId, scenarioId, cooperationProbability }) => {
      requireDb();
      await connectToDatabase();
      
      // 驗證
      if (cooperationProbability < 0 || cooperationProbability > 1) {
        throw new Error('cooperationProbability must be between 0 and 1');
      }
      
      // 更新 submission
      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }
      
      const existingIndex = submission.results.findIndex(r => r.scenarioId === scenarioId);
      
      if (existingIndex >= 0) {
        // 更新現有答案
        submission.results[existingIndex].cooperationProbability = cooperationProbability;
        submission.results[existingIndex].answeredAt = new Date();
      } else {
        // 新增答案
        submission.results.push({
          scenarioId,
          cooperationProbability,
          answeredAt: new Date(),
        });
        
        // ** KEY: 更新 scenario 的 responseCount (原子操作) **
        await ScenarioModel.findByIdAndUpdate(scenarioId, { $inc: { responseCount: 1 } });
      }
      
      await submission.save();
      return toSubmissionGraph(submission);
    },
    
    completeSurvey: async (_, { submissionId, demographics }) => {
      requireDb();
      await connectToDatabase();
      
      const submission = await SubmissionModel.findByIdAndUpdate(
        submissionId,
        {
          $set: {
            demographics,
            isCompleted: true,
            completedAt: new Date(),
          },
        },
        { new: true }
      );
      
      if (!submission) {
        throw new Error('Submission not found');
      }
      
      // 更新 session 的 submissionCount
      await SessionModel.findByIdAndUpdate(
        submission.sessionId,
        { $inc: { submissionCount: 1 } }
      );
      
      // ** Mixed Mode: 檢查 group completion (REQ-309) **
      const session = await SessionModel.findById(submission.sessionId);
      if (session && session.groupId && session.metadata?.createdFor === 'mixed') {
        console.log(`[completeSurvey] Checking Mixed Mode group completion for group: ${session.groupId}`);
        
        const group = await SessionGroupModel.findById(session.groupId);
        if (group && group.config?.targetSizePerScenario) {
          const targetSize = group.config.targetSizePerScenario;
          
          // 檢查有多少 scenarios 還沒達到 targetSize
          const incompleteCount = await ScenarioModel.countDocuments({
            groupId: session.groupId,
            responseCount: { $lt: targetSize }
          });
          
          console.log(`[completeSurvey] Incomplete scenarios: ${incompleteCount}`);
        }
      }
      
      return toSubmissionGraph(submission);
    },
    
    // ========================================================================
    // Admin Controls
    // ========================================================================
    
    deleteSessionGroup: async (_, { groupId }) => {
      requireDb();
      await connectToDatabase();
      
      // 刪除群組關聯的所有 sessions
      const sessions = await SessionModel.find({ groupId });
      const sessionIds = sessions.map(s => String(s._id));
      
      await SessionModel.deleteMany({ groupId });
      
      // 刪除所有關聯的 submissions
      await SubmissionModel.deleteMany({ sessionId: { $in: sessionIds } });
      
      // 刪除所有關聯的 scenarios
      await ScenarioModel.deleteMany({ groupId });
      
      // 刪除群組
      const result = await SessionGroupModel.deleteOne({ _id: groupId });
      
      return result.deletedCount > 0;
    },
    
    invalidateSubmission: async (_, { submissionId, isInvalid }) => {
      requireDb();
      await connectToDatabase();

      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Idempotency: skip if already in desired state
      if (submission.isInvalid === isInvalid) {
        return toSubmissionGraph(submission);
      }

      const delta = isInvalid ? -1 : 1;

      submission.isInvalid = isInvalid;
      await submission.save();

      // Adjust submissionCount on Session (only completed submissions contributed)
      if (submission.isCompleted) {
        await SessionModel.findByIdAndUpdate(
          submission.sessionId,
          { $inc: { submissionCount: delta } }
        );
      }

      // Adjust responseCount on each answered Scenario (floor at 0 on decrement)
      if (submission.results && submission.results.length > 0) {
        for (const result of submission.results) {
          if (delta < 0) {
            await ScenarioModel.updateOne(
              { _id: result.scenarioId, responseCount: { $gt: 0 } },
              { $inc: { responseCount: -1 } }
            );
          } else {
            await ScenarioModel.findByIdAndUpdate(
              result.scenarioId,
              { $inc: { responseCount: 1 } }
            );
          }
        }
      }

      return toSubmissionGraph(submission);
    },

    clearDatabase: async () => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Action denied: You cannot clear the database in production.');
      }
      requireDb();
      await connectToDatabase();
      try {
        await SessionModel.deleteMany({});
        await ScenarioModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        await SessionGroupModel.deleteMany({});
        return true;
      } catch (error) {
        console.error("Failed to clean database:", error);
        return false;
      }
    },
    
    // saveSessionEvents removed per REQ-413
    
  },
};
