import { connectToDatabase, isDbConfigured } from '../db.js';
import { SessionSetupModel, SubmissionModel } from '../models/SessionSetup.js';
import { SessionReplayModel } from '../models/SessionReplay.js';
import { SessionGroupModel } from '../models/SessionGroup.js';
import GraphQLJSON from 'graphql-type-json';
import { randomUUID } from 'crypto';
import { generateEdgeCombinations, combinationCount, validateBatchParams } from '../../utils/combinations.js';
import { generateDesignMatrix } from '../../utils/mathBackend.js';


function requireDb() {
  if (!isDbConfigured()) {
    throw new Error('MONGODB_URI is not configured. Set it in your environment to enable persistence.');
  }
}

async function toSetupGraph(doc) {
  if (!doc) return null;
  const submissionCount = await SubmissionModel.countDocuments({
    sessionId: String(doc._id),
  });
  return {
    id: String(doc._id),
    groupId: doc.groupId || null,
    activeEdgeIds: doc.activeEdgeIds,
    scenarios: doc.scenarios,
    focalNode: doc.focalNode,
    opponentNode: doc.opponentNode,
    sampleSize: doc.sampleSize || 20,
    submissionCount,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}

function toGroupGraph(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description || null,
    batchMode: doc.batchMode,
    edgeCount: doc.edgeCount,
    focalNode: doc.focalNode,
    opponentNode: doc.opponentNode,
    sampleSize: doc.sampleSize,
    totalSessions: doc.totalSessions,
    completedSessions: doc.completedSessions,
    status: doc.status,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}


function validateResults(results) {
  for (const answer of results) {
    if (answer.cooperationProbability < 0 || answer.cooperationProbability > 1) {
      throw new Error('cooperationProbability must be between 0 and 1');
    }
  }
}

function mapEntry(doc) {
  return {
    id: String(doc._id),
    sessionId: doc.sessionId,
    edgeId: doc.edgeId,
    results: doc.results || [],
    demographics: doc.demographics || null,
    isCompleted: doc.isCompleted === true,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}

export const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    health: () => 'ok',
    activeSessionSetup: async () => {
      requireDb();
      await connectToDatabase();
      const doc = await SessionSetupModel.findOne().sort({ updatedAt: -1 }).lean();
      return await toSetupGraph(doc);
    },
    sessionSetup: async (_, { id }) => {
      requireDb();
      await connectToDatabase();
      const doc = await SessionSetupModel.findById(id).lean();
      return await toSetupGraph(doc);
    },
    allSessionSetups: async (_, { excludeBatchSessions = false }) => {
      requireDb();
      await connectToDatabase();
      
      // 構建查詢條件
      const query = excludeBatchSessions
        ? { groupId: null }  // 只返回 manual sessions
        : {};                 // 返回所有 sessions
      
      const docs = await SessionSetupModel.find(query).sort({ createdAt: -1 }).lean();
      return await Promise.all(docs.map(doc => toSetupGraph(doc)));
    },
    recentSubmissions: async (_, { limit }) => {
      requireDb();
      await connectToDatabase();
      const docs = await SubmissionModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return docs.map((doc) => ({
        ...mapEntry(doc),
        isCompleted: doc.isCompleted === true,
      }));

    },
    getSessionReplay: async (_, { sessionId }) => {
      requireDb();
      await connectToDatabase();
      const chunks = await SessionReplayModel.find({ sessionId }).sort({ chunkIndex: 1 }).lean();
      if (!chunks || chunks.length === 0) return [];
      
      let allEvents = [];
      for (const chunk of chunks) {
        if (Array.isArray(chunk.events)) {
          allEvents = allEvents.concat(chunk.events);
        }
      }
      return allEvents;
    },
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
    sessionsByGroup: async (_, { groupId }) => {
      requireDb();
      await connectToDatabase();
      const docs = await SessionSetupModel.find({ groupId }).sort({ createdAt: 1 }).lean();
      return await Promise.all(docs.map(doc => toSetupGraph(doc)));
    },
  },
  Mutation: {
    saveSessionSetup: async (_, { setup }) => {
      requireDb();
      await connectToDatabase();

      // We create a new setup each time or update the last one? 
      // Given the user removed 'key', maybe they want a history.
      // I'll create a new one to be safe, or update the most recent.
      // Let's create a new one as it's cleaner without a key.
      const doc = await SessionSetupModel.create({
        _id: randomUUID(),
        activeEdgeIds: setup.activeEdgeIds,
        scenarios: setup.scenarios,
        focalNode: setup.focalNode,
        opponentNode: setup.opponentNode,
        sampleSize: setup.sampleSize,
      });

      return await toSetupGraph(doc.toObject());
    },
    startSurveyEntry: async (_, { sessionId, edgeId }, context) => {
      if (!context?.isTurnstileVerified) {
        throw new Error('Turnstile verification required before starting survey.');
      }

      requireDb();
      await connectToDatabase();

      const doc = await SubmissionModel.create({
        sessionId,
        edgeId,
        results: [],
        demographics: null,
        isCompleted: false,
      });

      return mapEntry(doc);
    },
    saveSurveyAnswer: async (_, { entryId, answer }) => {
      requireDb();
      validateResults([answer]);
      await connectToDatabase();

      const existing = await SubmissionModel.findById(entryId);
      if (!existing) {
        throw new Error('Survey entry not found.');
      }

      const results = Array.isArray(existing.results) ? [...existing.results] : [];
      const idx = results.findIndex((item) => item.scenarioId === answer.scenarioId);
      if (idx >= 0) {
        results[idx] = answer;
      } else {
        results.push(answer);
      }
      results.sort((a, b) => a.scenarioId - b.scenarioId);

      existing.results = results;
      await existing.save();
      return mapEntry(existing);
    },
    completeSurveyEntry: async (_, { entryId, demographics }) => {
      requireDb();
      await connectToDatabase();

      const doc = await SubmissionModel.findByIdAndUpdate(
        entryId,
        {
          $set: {
            demographics,
            isCompleted: true,
          },
        },
        { new: true }
      );

      if (!doc) {
        throw new Error('Survey entry not found.');
      }

      return mapEntry(doc);
    },
    submitSurvey: async (_, { sessionId, edgeId, results, demographics }) => {
      try {
        requireDb();
        validateResults(results);
        await connectToDatabase();

        const doc = await SubmissionModel.create({
          sessionId,
          edgeId,
          results,
          demographics,
          isCompleted: true,
        });

        // Use a 100% safe way to get ISO string
        let createdAtStr = new Date().toISOString();
        if (doc && doc.createdAt) {
          try {
            if (typeof doc.createdAt.toISOString === 'function') {
              createdAtStr = doc.createdAt.toISOString();
            } else {
              createdAtStr = new Date(doc.createdAt).toISOString();
            }
          } catch (e) {
            console.warn("Date conversion failed, using now()", e);
          }
        }

        return {
          id: String(doc._id),
          sessionId: doc.sessionId || sessionId,
          edgeId: doc.edgeId || edgeId,
          results: doc.results || results,
          demographics: doc.demographics || demographics,
          isCompleted: true,
          createdAt: createdAtStr,
        };
      } catch (error) {
        console.error("Survey submission failed:", error);
        throw error;
      }
    },
    saveSessionEvents: async (_, { sessionId, events }) => {
      requireDb();
      await connectToDatabase();

      if (!events || events.length === 0) return true;

      // Find the latest chunk for this session
      let latestChunk = await SessionReplayModel.findOne({ sessionId }).sort({ chunkIndex: -1 });

      if (!latestChunk) {
        latestChunk = await SessionReplayModel.create({ sessionId, chunkIndex: 0, eventCount: 0, events: [] });
      }

      // Check threshold (e.g., 2000 events) as a safe heuristic for 16MB MongoDB limit
      if (latestChunk.eventCount >= 2000) {
        latestChunk = await SessionReplayModel.create({ sessionId, chunkIndex: latestChunk.chunkIndex + 1, eventCount: 0, events: [] });
      }

      await SessionReplayModel.updateOne(
        { _id: latestChunk._id },
        { 
          $push: { events: { $each: events } },
          $inc: { eventCount: events.length }
        }
      );

      return true;
    },
    createBatchSessions: async (_, { input }) => {
      requireDb();
      await connectToDatabase();
      
      const { name, description, edgeCount, focalNode, opponentNode, sampleSize } = input;
      
      // 驗證參數
      const validation = validateBatchParams(edgeCount, 1000);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      const totalCombinations = validation.count;
      
      // 創建 SessionGroup
      const group = await SessionGroupModel.create({
        _id: randomUUID(),
        name,
        description: description || null,
        batchMode: true,
        edgeCount,
        focalNode,
        opponentNode,
        sampleSize,
        totalSessions: totalCombinations,
        completedSessions: 0,
        status: 'creating',
      });
      
      const groupId = String(group._id);
      
      // 生成所有邊緣組合
      const allEdges = [
        { id: 'A1-A2' }, { id: 'A1-B3' }, { id: 'A1-B4' },
        { id: 'A2-A1' }, { id: 'A2-B3' }, { id: 'A2-B4' },
        { id: 'B3-A1' }, { id: 'B3-A2' }, { id: 'B3-B4' },
        { id: 'B4-A1' }, { id: 'B4-A2' }, { id: 'B4-B3' },
      ];
      const combinations = generateEdgeCombinations(allEdges, edgeCount);
      
      // 批次準備文檔
      const sessionDocs = combinations.map(activeEdgeIds => {
        const scenarios = generateDesignMatrix(activeEdgeIds);
        return {
          _id: randomUUID(),
          groupId,
          activeEdgeIds,
          scenarios,
          focalNode,
          opponentNode,
          sampleSize,
        };
      });
      
      // 批次插入（效能優化）
      const insertedDocs = await SessionSetupModel.insertMany(sessionDocs);
      const sessionIds = insertedDocs.map(doc => String(doc._id));
      
      // 更新群組狀態
      await SessionGroupModel.updateOne(
        { _id: groupId },
        { $set: { status: 'active' } }
      );
      
      return {
        groupId,
        sessionsCreated: sessionIds.length,
        sessionIds,
      };
    },
    updateSessionGroupStatus: async (_, { groupId, status }) => {
      requireDb();
      await connectToDatabase();
      
      const validStatuses = ['creating', 'active', 'completed', 'archived'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const doc = await SessionGroupModel.findByIdAndUpdate(
        groupId,
        { $set: { status } },
        { new: true }
      );
      
      if (!doc) {
        throw new Error('SessionGroup not found');
      }
      
      return toGroupGraph(doc);
    },
    deleteSessionGroup: async (_, { groupId }) => {
      requireDb();
      await connectToDatabase();
      
      // 刪除群組關聯的所有 sessions
      await SessionSetupModel.deleteMany({ groupId });
      
      // 刪除所有關聯的 submissions
      const sessions = await SessionSetupModel.find({ groupId });
      const sessionIds = sessions.map(s => String(s._id));
      await SubmissionModel.deleteMany({ sessionId: { $in: sessionIds } });
      
      // 刪除群組
      const result = await SessionGroupModel.deleteOne({ _id: groupId });
      
      return result.deletedCount > 0;
    },
    clearDatabase: async () => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Action denied: You cannot clear the database in production.');
      }
      requireDb();
      await connectToDatabase();
      try {
        await SessionSetupModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        await SessionReplayModel.deleteMany({});
        await SessionGroupModel.deleteMany({});
        return true;
      } catch (error) {
        console.error("Failed to clean database:", error);
        return false;
      }
    },
  },
};

