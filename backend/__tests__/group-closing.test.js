/**
 * Full Mixed group closes (REQ-309, REQ-405.1, BUG-010) and confirmed answers are final (REQ-402.4).
 * Runs against its own in-memory MongoDB, so no local database is needed.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SessionGroupModel } from '../models/SessionGroup.js';
import { ScenarioModel } from '../models/Scenario.js';
import { SessionModel } from '../models/Session.js';
import { SubmissionModel } from '../models/Submission.js';
import { resolvers } from '../graphql/resolvers.js';
import { connectToDatabase } from '../db.js';
import { QUESTIONNAIRE } from '../../utils/questionnaire.js';

const { Mutation: M } = resolvers;
const ctx = { isTurnstileVerified: true };
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('group-closing-test');
  await connectToDatabase();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([SessionGroupModel, ScenarioModel, SessionModel, SubmissionModel].map((m) => m.deleteMany({})));
});

/** A Mixed group of two scenarios, each needing one answer; every participant gets both. */
async function makeGroup() {
  const group = await SessionGroupModel.create({
    name: 'closing',
    config: { maxK: 1, scenariosPerSession: 2, targetSizePerScenario: 1, focalNode: 'KMT1', opponentNode: 'DPP4', sampleSize: 1 },
    totalScenarios: 2,
  });
  const groupId = String(group._id);
  for (const i of [0, 1]) {
    await ScenarioModel.create({
      _id: `${groupId}-s${i}`, groupId, focalNode: 'KMT1', opponentNode: 'DPP4', activeEdgeIds: [], edgeStates: {}, scenarioIndex: i, targetSize: 1,
    });
  }
  return groupId;
}

async function participant(groupId, participantId, { finish = true, answer = true } = {}) {
  const { sessionId, assignedScenarios } = await M.startMixedSession(null, { groupId, participantId }, ctx);
  const sub = await M.startSurvey(null, { sessionId, participantId, consent: { consentedAt: new Date().toISOString(), version: 'test' } }, ctx);
  if (answer) for (const s of assignedScenarios) await M.saveSurveyAnswer(null, { submissionId: sub._id, scenarioId: s._id, cooperationProbability: 0.5, responseTime: 4200 });
  if (finish) await M.completeSurvey(null, { submissionId: sub._id, registrationCode: 'CODE', email: 'a@b.c', questionnaire: QUESTIONNAIRE.map((q) => ({ questionId: q.id, answer: q.options[0] })) });
  return { submissionId: sub._id, scenarioIds: assignedScenarios.map((s) => s._id) };
}

const status = async (groupId) => (await SessionGroupModel.findById(groupId).lean()).status;

describe('Mixed group closes when every scenario reached its target (REQ-309, REQ-405.1)', () => {
  it('stays active until the last scenario reaches its target, then completes', async () => {
    const groupId = await makeGroup();
    expect(await status(groupId)).toBe('active');
    await participant(groupId, 'p1');
    expect(await status(groupId)).toBe('completed');
    expect((await resolvers.Query.sessionGroup(null, { id: groupId })).status).toBe('completed');
  });

  it('refuses a new session for a completed group but lets an existing participant resume', async () => {
    const groupId = await makeGroup();
    await participant(groupId, 'p1');
    await expect(M.startMixedSession(null, { groupId, participantId: 'p2' }, ctx)).rejects.toThrow(/GROUP_FULL/);
    await expect(M.startMixedSession(null, { groupId, participantId: 'p1' }, ctx)).resolves.toMatchObject({ sessionId: expect.any(String) });
    expect(await SessionModel.countDocuments({ groupId })).toBe(1);
  });

  it('re-opens when invalidating drops a scenario below target, and closes again on restore', async () => {
    const groupId = await makeGroup();
    const { submissionId } = await participant(groupId, 'p1');
    await M.invalidateSubmission(null, { submissionId, isInvalid: true });
    expect(await status(groupId)).toBe('active');
    await M.invalidateSubmission(null, { submissionId, isInvalid: false });
    expect(await status(groupId)).toBe('completed');
  });
});

describe('Response time is recorded (REQ-402.5)', () => {
  it('stores responseTime with the answer and rejects a missing or negative one', async () => {
    const groupId = await makeGroup();
    const { submissionId } = await participant(groupId, 'p1', { finish: false });
    const saved = await SubmissionModel.findById(submissionId).lean();
    expect(saved.results.map((r) => r.responseTime)).toEqual(saved.results.map(() => 4200));

    const fresh = await participant(groupId, 'p2', { finish: false, answer: false });
    for (const responseTime of [-1, undefined]) {
      await expect(M.saveSurveyAnswer(null, { submissionId: fresh.submissionId, scenarioId: fresh.scenarioIds[0], cooperationProbability: 0.5, responseTime }))
        .rejects.toThrow(/responseTime/);
    }
    expect((await SubmissionModel.findById(fresh.submissionId).lean()).results).toHaveLength(0);
  });
});

describe('Confirmed answers are final (REQ-402.4)', () => {
  it('rejects a different value for an answered scenario and accepts a same-value retry', async () => {
    const groupId = await makeGroup();
    const { submissionId, scenarioIds: [first] } = await participant(groupId, 'p1', { finish: false });
    await expect(M.saveSurveyAnswer(null, { submissionId, scenarioId: first, cooperationProbability: 0.5, responseTime: 4200 })).resolves.toBeTruthy();
    await expect(M.saveSurveyAnswer(null, { submissionId, scenarioId: first, cooperationProbability: 0.9, responseTime: 4200 })).rejects.toThrow(/ANSWER_LOCKED/);
    const saved = await SubmissionModel.findById(submissionId).lean();
    expect(saved.results.find((r) => r.scenarioId === first).cooperationProbability).toBe(0.5);
    expect((await ScenarioModel.findById(first).lean()).responseCount).toBe(1);
  });

  it('rejects any answer on a completed submission', async () => {
    const groupId = await makeGroup();
    const { submissionId, scenarioIds: [first] } = await participant(groupId, 'p1');
    await expect(M.saveSurveyAnswer(null, { submissionId, scenarioId: first, cooperationProbability: 0.5, responseTime: 4200 })).rejects.toThrow(/ANSWER_LOCKED/);
  });
});
