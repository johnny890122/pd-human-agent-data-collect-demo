/**
 * Persisted payout (REQ-408.5) and admin-only participant data (REQ-408.7, REQ-408.8).
 * Runs against its own in-memory MongoDB, so no local database is needed.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SessionModel } from '../models/Session.js';
import { SubmissionModel } from '../models/Submission.js';
import { resolvers } from '../graphql/resolvers.js';
import { connectToDatabase } from '../db.js';
import { PARTICIPATION_FEE_NTD } from '../../utils/payment.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('payout-test');
  await connectToDatabase();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await SubmissionModel.deleteMany({});
  await SessionModel.deleteMany({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const answer = (cooperationProbability) => ({ scenarioId: 'scenario-1', cooperationProbability });

describe('drawRealisedRound payout (REQ-408.5)', () => {
  it('computes and persists the payout on the first draw', async () => {
    // No session/group context → the partner falls back to a random draw; pin Math.random
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const submission = await SubmissionModel.create({ sessionId: 'no-session', results: [answer(0)] });

    const debrief = await resolvers.Mutation.drawRealisedRound(null, { submissionId: String(submission._id) });

    // 您 0.5 < 0 → 不給; 搭檔 0.5 < 0.5 → 不給 → 1 點
    expect(debrief).toMatchObject({ realisedRoundIndex: 0, realisedPoints: 1, payoutNtd: 100 + PARTICIPATION_FEE_NTD });
    const saved = await SubmissionModel.findById(submission._id).lean();
    expect(saved).toMatchObject({ realisedPoints: 1, payoutNtd: 100 + PARTICIPATION_FEE_NTD });
  });

  it('returns the saved payout on repeat calls without redrawing', async () => {
    const submission = await SubmissionModel.create({ sessionId: 'no-session', results: [answer(0.5), answer(0.5)] });
    const first = await resolvers.Mutation.drawRealisedRound(null, { submissionId: String(submission._id) });
    const second = await resolvers.Mutation.drawRealisedRound(null, { submissionId: String(submission._id) });
    expect(second).toEqual(first);
  });

  it('backfills submissions drawn before the payout was persisted', async () => {
    const submission = await SubmissionModel.create({
      sessionId: 'no-session',
      results: [answer(0.9), answer(0.1)],
      realisedRoundIndex: 1,
      opponentProbs: [0.2, 0.8],
      myDecisions: [true, false],
      opponentDecisions: [false, true],
    });

    const debrief = await resolvers.Mutation.drawRealisedRound(null, { submissionId: String(submission._id) });

    // Round 2: 您 不給 / 搭檔 給 → 3 點
    expect(debrief).toMatchObject({ realisedRoundIndex: 1, realisedPoints: 3, payoutNtd: 300 + PARTICIPATION_FEE_NTD });
    const saved = await SubmissionModel.findById(submission._id).lean();
    expect(saved).toMatchObject({ realisedPoints: 3, payoutNtd: 300 + PARTICIPATION_FEE_NTD });
  });

  it('never recomputes an existing payout', async () => {
    const submission = await SubmissionModel.create({
      sessionId: 'no-session',
      results: [answer(1)],
      realisedRoundIndex: 0,
      opponentProbs: [1],
      myDecisions: [true],
      opponentDecisions: [true],
      realisedPoints: 2,
      payoutNtd: 999, // e.g. drawn under an earlier fee setting
    });

    const debrief = await resolvers.Mutation.drawRealisedRound(null, { submissionId: String(submission._id) });
    expect(debrief.payoutNtd).toBe(999);
  });
});

describe('participant data requires the admin login (REQ-408.7, REQ-408.8)', () => {
  it('rejects unauthenticated submission queries', async () => {
    await expect(resolvers.Query.recentSubmissions(null, {}, { isAdmin: false })).rejects.toThrow('Unauthorized');
    await expect(resolvers.Query.submissionsByGroup(null, { groupId: 'g1' }, {})).rejects.toThrow('Unauthorized');
  });

  it('returns every submission of the group, and only that group', async () => {
    await SessionModel.create([
      { _id: 'session-a', scenarioIds: ['scenario-1'], focalNode: 'KMT1', opponentNode: 'DPP3', sampleSize: 1, groupId: 'g1' },
      { _id: 'session-b', scenarioIds: ['scenario-1'], focalNode: 'KMT1', opponentNode: 'DPP3', sampleSize: 1, groupId: 'g2' },
    ]);
    await SubmissionModel.create([
      { sessionId: 'session-a', participantId: 'p1' },
      { sessionId: 'session-a', participantId: 'p2' },
      { sessionId: 'session-b', participantId: 'p3' },
    ]);

    const inGroup = await resolvers.Query.submissionsByGroup(null, { groupId: 'g1' }, { isAdmin: true });
    expect(inGroup.map(s => s.participantId).sort()).toEqual(['p1', 'p2']);
  });
});
