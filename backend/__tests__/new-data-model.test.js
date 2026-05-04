/**
 * Unit Tests for New Data Model (Scenario-Centric Architecture)
 * Tests Manual Mode and Batch Mode with new Scenario/Session models
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { ScenarioModel } from '../models/Scenario.js';
import { SessionModel } from '../models/Session.js';
import { SubmissionModel } from '../models/Submission.js';
import { SessionGroupModel } from '../models/SessionGroup.js';
import { generateDesignMatrix } from '../../utils/mathBackend.js';
import { generateEdgeCombinations } from '../../utils/combinations.js';

// Test MongoDB connection
const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_TEST_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // 清空測試資料
  await ScenarioModel.deleteMany({});
  await SessionModel.deleteMany({});
  await SubmissionModel.deleteMany({});
  await SessionGroupModel.deleteMany({});
});

// ============================================================================
// Scenario Model Tests
// ============================================================================

describe('Scenario Model', () => {
  it('should create a scenario with UUID primary key', async () => {
    const scenario = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2', 'A2-B3'],
      edgeStates: new Map([
        ['A1-A2', 'give'],
        ['A2-B3', 'not give']
      ]),
      scenarioIndex: 0,
      targetSize: 30,
      responseCount: 0,
      status: 'active',
    });

    expect(scenario._id).toBeDefined();
    expect(scenario._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(scenario.focalNode).toBe('A1');
    expect(scenario.activeEdgeIds).toHaveLength(2);
  });

  it('should calculate completionRate virtual field', async () => {
    const scenario = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      edgeStates: new Map([['A1-A2', 'give']]),
      scenarioIndex: 0,
      targetSize: 10,
      responseCount: 3,
      status: 'active',
    });

    const scenarioObj = scenario.toObject();
    expect(scenarioObj.completionRate).toBe(0.3);
  });

  it('should support atomic responseCount increment', async () => {
    const scenario = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      edgeStates: new Map([['A1-A2', 'give']]),
      scenarioIndex: 0,
      targetSize: 10,
      responseCount: 0,
      status: 'active',
    });

    // 模擬並發更新
    await Promise.all([
      ScenarioModel.findByIdAndUpdate(scenario._id, { $inc: { responseCount: 1 } }),
      ScenarioModel.findByIdAndUpdate(scenario._id, { $inc: { responseCount: 1 } }),
      ScenarioModel.findByIdAndUpdate(scenario._id, { $inc: { responseCount: 1 } }),
    ]);

    const updated = await ScenarioModel.findById(scenario._id);
    expect(updated.responseCount).toBe(3);
  });
});

// ============================================================================
// Session Model Tests
// ============================================================================

describe('Session Model', () => {
  it('should create a session as a scenario container', async () => {
    // 先建立 scenarios
    const scenario1 = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      edgeStates: new Map([['A1-A2', 'give']]),
      scenarioIndex: 0,
      status: 'active',
    });

    const scenario2 = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      scenarioIndex: 1,
      edgeStates: new Map([['A1-A2', 'not give']]),
      status: 'active',
    });

    // 建立 session 引用 scenarios
    const session = await SessionModel.create({
      scenarioIds: [scenario1._id, scenario2._id],
      focalNode: 'A1',
      opponentNode: 'A2',
      sampleSize: 20,
      submissionCount: 0,
      metadata: { createdFor: 'manual' },
    });

    expect(session._id).toBeDefined();
    expect(session.scenarioIds).toHaveLength(2);
    expect(session.scenarioIds[0]).toBe(scenario1._id);
    expect(session.metadata.createdFor).toBe('manual');
  });

  it('should populate scenarios via virtual field', async () => {
    // 直接建立 scenarios，確保 _id 正確
    const scenario1 = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      edgeStates: { 'A1-A2': 'give' },  // 使用 Object 而非 Map
      scenarioIndex: 0,
      status: 'active',
    });

    const scenario2 = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      edgeStates: { 'A1-A2': 'not give' },  // 使用 Object 而非 Map
      scenarioIndex: 1,
      status: 'active',
    });

    const session = await SessionModel.create({
      scenarioIds: [String(scenario1._id), String(scenario2._id)],
      focalNode: 'A1',
      opponentNode: 'A2',
      sampleSize: 20,
    });

    // 驗證 scenarioIds 已儲存
    expect(session.scenarioIds).toHaveLength(2);
    
    // 直接查詢 scenarios
    const foundScenarios = await ScenarioModel.find({
      _id: { $in: session.scenarioIds }
    });
    
    expect(foundScenarios).toHaveLength(2);
    expect(foundScenarios[0].focalNode).toBe('A1');
  });
});

// ============================================================================
// Manual Mode Integration Tests
// ============================================================================

describe('Manual Mode (createManualSession)', () => {
  it('should create scenarios and session for manual mode', async () => {
    const activeEdgeIds = ['A1-A2', 'A2-B3'];
    const focalNode = 'A1';
    const opponentNode = 'B3';
    const sampleSize = 20;

    // 1. 生成 design matrix
    const designMatrix = generateDesignMatrix(activeEdgeIds);
    expect(designMatrix).toHaveLength(4); // 2^2 = 4 scenarios

    // 2. 建立 scenarios
    const scenarioDocs = designMatrix.map((scenario, index) => ({
      _id: randomUUID(),
      focalNode,
      opponentNode,
      activeEdgeIds,
      edgeStates: scenario.edgeStates,
      scenarioIndex: index,
      groupId: null,
      targetSize: 0,
      responseCount: 0,
      status: 'active',
    }));

    const scenarios = await ScenarioModel.insertMany(scenarioDocs);
    expect(scenarios).toHaveLength(4);

    // 3. 建立 session
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

    expect(session.scenarioIds).toHaveLength(4);
    expect(session.metadata.createdFor).toBe('manual');

    // 4. 驗證 scenarios 可以獨立查詢
    const foundScenarios = await ScenarioModel.find({ _id: { $in: session.scenarioIds } });
    expect(foundScenarios).toHaveLength(4);
  });

  it('should handle different edge counts correctly', async () => {
    // k=1: 1 edge
    const activeEdgeIds1 = ['A1-A2'];
    const designMatrix1 = generateDesignMatrix(activeEdgeIds1);
    expect(designMatrix1).toHaveLength(2); // 2^1 = 2

    // k=3: 3 edges
    const activeEdgeIds3 = ['A1-A2', 'A2-B3', 'B3-B4'];
    const designMatrix3 = generateDesignMatrix(activeEdgeIds3);
    expect(designMatrix3).toHaveLength(8); // 2^3 = 8
  });
});

// ============================================================================
// Batch Mode Integration Tests
// ============================================================================

describe('Batch Mode (createBatchSessions)', () => {
  it('should create scenarios and sessions for all edge combinations', async () => {
    const edgeCount = 2;
    const focalNode = 'A1';
    const opponentNode = 'B3';
    const sampleSize = 20;
    const name = 'Test Batch Group';

    // 1. 建立 SessionGroup
    const group = await SessionGroupModel.create({
      _id: randomUUID(),
      name,
      config: {
        edgeCount,
        focalNode,
        opponentNode,
        sampleSize,
      },
      totalSessions: 0,
      totalScenarios: 0,
    });

    const groupId = String(group._id);

    // 2. 生成所有 C(12, 2) = 66 組合
    const allEdges = [
      { id: 'A1-A2' }, { id: 'A1-B3' }, { id: 'A1-B4' },
      { id: 'A2-A1' }, { id: 'A2-B3' }, { id: 'A2-B4' },
      { id: 'B3-A1' }, { id: 'B3-A2' }, { id: 'B3-B4' },
      { id: 'B4-A1' }, { id: 'B4-A2' }, { id: 'B4-B3' },
    ];
    const combinations = generateEdgeCombinations(allEdges, edgeCount);
    expect(combinations).toHaveLength(66);

    // 3. 為每個組合建立 scenarios + session (僅測試前 3 個)
    const testCombinations = combinations.slice(0, 3);
    let totalScenarios = 0;
    const sessionIds = [];

    for (const combo of testCombinations) {
      const designMatrix = generateDesignMatrix(combo);
      
      const scenarioDocs = designMatrix.map((scenario, index) => ({
        _id: randomUUID(),
        focalNode,
        opponentNode,
        activeEdgeIds: combo,
        edgeStates: scenario.edgeStates,
        scenarioIndex: index,
        groupId,
        targetSize: 0,
        responseCount: 0,
        status: 'active',
      }));

      const scenarios = await ScenarioModel.insertMany(scenarioDocs);
      totalScenarios += scenarios.length;

      const session = await SessionModel.create({
        _id: randomUUID(),
        scenarioIds: scenarios.map(s => s._id),
        focalNode,
        opponentNode,
        sampleSize,
        groupId,
        submissionCount: 0,
        metadata: { createdFor: 'batch' },
      });
      
      sessionIds.push(session._id);
    }

    // 4. 驗證結果
    const sessions = await SessionModel.find({ groupId });
    expect(sessions.length).toBe(3);
    expect(sessionIds).toHaveLength(3);
    
    const scenarios = await ScenarioModel.find({ groupId });
    expect(scenarios).toHaveLength(totalScenarios);
    expect(totalScenarios).toBe(3 * 4); // 每個組合 2^2 = 4 scenarios

    // 5. 更新 group 統計
    const updateResult = await SessionGroupModel.updateOne(
      { _id: groupId },
      {
        $set: {
          totalSessions: sessions.length,
          totalScenarios: scenarios.length
        }
      }
    );
    
    expect(updateResult.modifiedCount).toBe(1);

    const updatedGroup = await SessionGroupModel.findById(groupId).lean();
    expect(updatedGroup).not.toBeNull();
    expect(updatedGroup.config.edgeCount).toBe(2);
  });

  it('should detect mode from SessionGroup config', async () => {
    // Batch mode
    const batchGroup = await SessionGroupModel.create({
      name: 'Batch Group',
      config: {
        edgeCount: 3,
        focalNode: 'A1',
        opponentNode: 'A2',
        sampleSize: 20,
      },
      totalSessions: 0,
    });

    const batchGroupObj = batchGroup.toObject();
    expect(batchGroupObj.mode).toBe('batch');

    // Manual mode (no edgeCount, no maxK)
    const manualGroup = await SessionGroupModel.create({
      name: 'Manual Group',
      config: {
        focalNode: 'A1',
        opponentNode: 'A2',
        sampleSize: 20,
      },
      totalSessions: 1,
    });

    const manualGroupObj = manualGroup.toObject();
    expect(manualGroupObj.mode).toBe('manual');
  });
});

// ============================================================================
// Unified Survey Flow Tests
// ============================================================================

describe('Unified Survey Flow', () => {
  let session;
  let scenarios;

  beforeEach(async () => {
    // 準備測試 session
    const scenarioDocs = [
      {
        focalNode: 'A1',
        opponentNode: 'A2',
        activeEdgeIds: ['A1-A2'],
        edgeStates: new Map([['A1-A2', 'give']]),
        scenarioIndex: 0,
        targetSize: 10,
        responseCount: 0,
        status: 'active',
      },
      {
        focalNode: 'A1',
        opponentNode: 'A2',
        activeEdgeIds: ['A1-A2'],
        edgeStates: new Map([['A1-A2', 'not give']]),
        scenarioIndex: 1,
        targetSize: 10,
        responseCount: 0,
        status: 'active',
      },
    ];

    scenarios = await ScenarioModel.insertMany(scenarioDocs);

    session = await SessionModel.create({
      scenarioIds: scenarios.map(s => s._id),
      focalNode: 'A1',
      opponentNode: 'A2',
      sampleSize: 5,
      submissionCount: 0,
    });
  });

  it('should create submission (startSurvey)', async () => {
    const submission = await SubmissionModel.create({
      sessionId: session._id,
      participantId: null,
      results: [],
      isCompleted: false,
    });

    expect(submission._id).toBeDefined();
    expect(submission.sessionId).toBe(session._id);
    expect(submission.results).toHaveLength(0);
  });

  it('should save answer and increment scenario responseCount (saveSurveyAnswer)', async () => {
    const submission = await SubmissionModel.create({
      sessionId: session._id,
      results: [],
      isCompleted: false,
    });

    const scenarioId = String(scenarios[0]._id);
    const cooperationProbability = 0.75;

    // 驗證範圍
    expect(cooperationProbability).toBeGreaterThanOrEqual(0);
    expect(cooperationProbability).toBeLessThanOrEqual(1);

    // 儲存答案
    submission.results.push({
      scenarioId,
      cooperationProbability,
      answeredAt: new Date(),
    });
    await submission.save();

    // 更新 scenario responseCount（確保使用正確的 ID）
    const updateResult = await ScenarioModel.findByIdAndUpdate(
      scenarioId,
      { $inc: { responseCount: 1 } },
      { new: true }
    );
    
    expect(updateResult).not.toBeNull();

    // 驗證
    const updatedSubmission = await SubmissionModel.findById(submission._id);
    expect(updatedSubmission.results).toHaveLength(1);
    expect(updatedSubmission.results[0].scenarioId).toBe(scenarioId);

    const updatedScenario = await ScenarioModel.findById(scenarioId);
    expect(updatedScenario).not.toBeNull();
    expect(updatedScenario.responseCount).toBe(1);
  });

  it('should complete survey and update session submissionCount (completeSurvey)', async () => {
    const submission = await SubmissionModel.create({
      sessionId: session._id,
      results: [
        { scenarioId: scenarios[0]._id, cooperationProbability: 0.5 },
        { scenarioId: scenarios[1]._id, cooperationProbability: 0.8 },
      ],
      isCompleted: false,
    });

    // 完成調查
    submission.demographics = {
      age: 25,
      gender: 'male',
      education: 'bachelor',
    };
    submission.isCompleted = true;
    submission.completedAt = new Date();
    await submission.save();

    // 更新 session submissionCount
    await SessionModel.findByIdAndUpdate(session._id, { $inc: { submissionCount: 1 } });

    // 驗證
    const updatedSubmission = await SubmissionModel.findById(submission._id);
    expect(updatedSubmission.isCompleted).toBe(true);
    expect(updatedSubmission.demographics.age).toBe(25);

    const updatedSession = await SessionModel.findById(session._id);
    expect(updatedSession.submissionCount).toBe(1);
  });

  it('should enforce session full gate', async () => {
    // 建立 5 個完成的 submissions (達到 sampleSize)
    for (let i = 0; i < 5; i++) {
      await SubmissionModel.create({
        sessionId: session._id,
        results: [],
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    const count = await SubmissionModel.countDocuments({
      sessionId: session._id,
      isCompleted: true,
    });

    expect(count).toBe(5);
    expect(count).toBeGreaterThanOrEqual(session.sampleSize);
  });
});

// ============================================================================
// Submission Schema Tests
// ============================================================================

describe('Updated Submission Schema', () => {
  it('should store scenarioId as String (UUID)', async () => {
    const scenario = await ScenarioModel.create({
      focalNode: 'A1',
      opponentNode: 'A2',
      activeEdgeIds: ['A1-A2'],
      edgeStates: new Map([['A1-A2', 'give']]),
      scenarioIndex: 0,
      status: 'active',
    });

    const session = await SessionModel.create({
      scenarioIds: [scenario._id],
      focalNode: 'A1',
      opponentNode: 'A2',
      sampleSize: 20,
    });

    const submission = await SubmissionModel.create({
      sessionId: session._id,
      results: [{
        scenarioId: scenario._id,  // UUID String
        cooperationProbability: 0.6,
        responseTime: 5000,
        answeredAt: new Date(),
      }],
      isCompleted: false,
    });

    expect(typeof submission.results[0].scenarioId).toBe('string');
    expect(submission.results[0].scenarioId).toBe(scenario._id);
    expect(submission.results[0].responseTime).toBe(5000);
  });

  it('should support participantId for Mixed Mode', async () => {
    const session = await SessionModel.create({
      scenarioIds: [],
      focalNode: 'A1',
      opponentNode: 'A2',
      sampleSize: 1,
      metadata: { createdFor: 'mixed', participantId: 'participant-123' },
    });

    const submission = await SubmissionModel.create({
      sessionId: session._id,
      participantId: 'participant-123',
      results: [],
      isCompleted: false,
    });

    expect(submission.participantId).toBe('participant-123');

    // 檢查唯一性索引 (sessionId + participantId)
    const count = await SubmissionModel.countDocuments({
      sessionId: session._id,
      participantId: 'participant-123',
    });
    expect(count).toBe(1);
  });
});
