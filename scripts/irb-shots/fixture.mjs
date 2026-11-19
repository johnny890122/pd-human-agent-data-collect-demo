// Fixed fixture for the IRB before/after screenshots (NFR-7, docs/design.md Phase 40).
// Every run seeds exactly these documents, so "before" and "after" show the same data.
import mongoose from 'mongoose';
import { SessionGroupModel } from '../../backend/models/SessionGroup.js';
import { SessionModel } from '../../backend/models/Session.js';
import { ScenarioModel } from '../../backend/models/Scenario.js';
import { SubmissionModel } from '../../backend/models/Submission.js';

export const FIXTURE = {
  groupId: 'irb-fixture-group',
  // In-progress participant: used for every participant-facing screen
  sessionId: 'irb-fixture-session',
  // Submission._id is an ObjectId in the schema, so the fixed IDs are 24-char hex strings
  liveSubmissionId: '6a1f0000000000000000a001',
  // Completed participant: feeds the admin page, the payment ledger and evidence E1
  doneSessionId: 'irb-fixture-session-done',
  doneSubmissionId: '6a1f0000000000000000a002',
  focalNode: 'KMT1',
  opponentNode: 'DPP3',
};

const FIXED_TIME = new Date('2026-10-01T02:00:00.000Z');
const COMPLETED_TIME = new Date('2026-10-01T02:25:00.000Z');

const SCENARIOS = [
  { _id: 'irb-fixture-scn-1', scenarioIndex: 0, edgeStates: { 'DPP3-KMT1': 'give', 'KMT2-DPP4': 'not give', 'DPP4-KMT2': 'give' } },
  { _id: 'irb-fixture-scn-2', scenarioIndex: 1, edgeStates: { 'KMT2-KMT1': 'give', 'DPP3-KMT2': 'not give', 'DPP4-DPP3': 'give' } },
  { _id: 'irb-fixture-scn-3', scenarioIndex: 2, edgeStates: { 'KMT1-DPP4': 'not give', 'DPP4-KMT1': 'give', 'DPP3-DPP4': 'not give' } },
];

const results = (probabilities) =>
  SCENARIOS.map((scenario, i) => ({
    scenarioId: scenario._id,
    cooperationProbability: probabilities[i],
    answeredAt: new Date(FIXED_TIME.getTime() + (i + 1) * 60_000),
  }));

function buildDocuments() {
  const group = {
    _id: FIXTURE.groupId,
    name: 'IRB 截圖測試組',
    description: '僅供截圖使用的測試資料',
    config: {
      maxK: 3,
      scenariosPerSession: SCENARIOS.length,
      targetSizePerScenario: 5,
      focalNode: FIXTURE.focalNode,
      opponentNode: FIXTURE.opponentNode,
      sampleSize: 1,
    },
    totalSessions: 2,
    totalScenarios: SCENARIOS.length,
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
  };

  const scenarios = SCENARIOS.map((scenario) => ({
    _id: scenario._id,
    focalNode: FIXTURE.focalNode,
    opponentNode: FIXTURE.opponentNode,
    activeEdgeIds: Object.keys(scenario.edgeStates),
    edgeStates: scenario.edgeStates,
    scenarioIndex: scenario.scenarioIndex,
    groupId: FIXTURE.groupId,
    targetSize: 5,
    responseCount: 2,
    status: 'active',
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
  }));

  const session = (id, participantId, submissionCount) => ({
    _id: id,
    scenarioIds: SCENARIOS.map((scenario) => scenario._id),
    focalNode: FIXTURE.focalNode,
    opponentNode: FIXTURE.opponentNode,
    sampleSize: 1,
    groupId: FIXTURE.groupId,
    submissionCount,
    metadata: { participantId, createdFor: 'mixed' },
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
  });

  const sessions = [
    session(FIXTURE.sessionId, '測試參與者A', 0),
    session(FIXTURE.doneSessionId, '測試參與者B', 1),
  ];

  // Draws are pre-set so the debrief is identical in every run.
  // Live participant: realised round 2 = 您 不給 / 搭檔 給 → 3 點.
  // realisedPoints / payoutNtd are intentionally absent: the old code has no such fields,
  // and the new drawRealisedRound backfills them (REQ-408.5 legacy path).
  const submissions = [
    {
      _id: new mongoose.Types.ObjectId(FIXTURE.liveSubmissionId),
      sessionId: FIXTURE.sessionId,
      participantId: '測試參與者A',
      results: results([0.7, 0.3, 0.9]),
      isCompleted: false,
      completedAt: null,
      isInvalid: false,
      realisedRoundIndex: 1,
      opponentProbs: [0.35, 0.8, 0.6],
      myDecisions: [true, false, true],
      opponentDecisions: [false, true, true],
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    },
    {
      _id: new mongoose.Types.ObjectId(FIXTURE.doneSubmissionId),
      sessionId: FIXTURE.doneSessionId,
      participantId: '測試參與者B',
      results: results([0.8, 0.6, 0.2]),
      registrationCode: 'A1B2C3',
      email: 'participant@example.com',
      isCompleted: true,
      completedAt: COMPLETED_TIME,
      isInvalid: false,
      realisedRoundIndex: 0,
      opponentProbs: [0.9, 0.2, 0.1],
      myDecisions: [true, true, false],
      opponentDecisions: [true, false, false],
      createdAt: FIXED_TIME,
      updatedAt: COMPLETED_TIME,
    },
  ];

  return { group, scenarios, sessions, submissions };
}

/**
 * Replace the fixture documents in the database at `mongoUri`.
 * Documents are validated against the app's Mongoose schemas, then written through the raw
 * collections so the fixed createdAt/updatedAt values survive (Mongoose timestamps would
 * overwrite them).
 */
export async function seedFixture(mongoUri) {
  const connection = await mongoose.createConnection(mongoUri).asPromise();
  try {
    const { group, scenarios, sessions, submissions } = buildDocuments();
    const batches = [
      [SessionGroupModel, [group]],
      [ScenarioModel, scenarios],
      [SessionModel, sessions],
      [SubmissionModel, submissions],
    ];

    for (const [Model, docs] of batches) {
      for (const doc of docs) {
        const error = new Model(doc).validateSync();
        if (error) throw new Error(`Fixture ${Model.modelName} ${doc._id} is invalid: ${error.message}`);
      }
      const collection = connection.collection(Model.collection.collectionName);
      await collection.deleteMany({ _id: { $in: docs.map((doc) => doc._id) } });
      await collection.insertMany(docs);
    }
  } finally {
    await connection.close();
  }
}
