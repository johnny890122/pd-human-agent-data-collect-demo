/**
 * Post-survey questionnaire (REQ-416): saved by completeSurvey, validated, admin-only.
 * Runs against its own in-memory MongoDB, so no local database is needed.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SessionModel } from '../models/Session.js';
import { SubmissionModel } from '../models/Submission.js';
import { resolvers } from '../graphql/resolvers.js';
import { connectToDatabase } from '../db.js';
import { QUESTIONNAIRE } from '../../utils/questionnaire.js';

let mongo;
const demographics = { age: 0, gender: 'CODE1', education: 'a@example.com' };
const answers = QUESTIONNAIRE.map((q, i) => ({ questionId: q.id, answer: q.options[i % 2] }));

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('questionnaire-test');
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

const newSubmission = async () => String((await SubmissionModel.create({ sessionId: 'no-session', results: [] }))._id);

describe('completeSurvey with the questionnaire (REQ-416)', () => {
  it('saves all eight answers with the demographics', async () => {
    const submissionId = await newSubmission();
    await resolvers.Mutation.completeSurvey(null, { submissionId, demographics, questionnaire: answers });
    const saved = await SubmissionModel.findById(submissionId).lean();
    expect(saved.isCompleted).toBe(true);
    expect(saved.questionnaire).toEqual(answers);
  });

  it('rejects an incomplete or off-list questionnaire and completes nothing', async () => {
    const submissionId = await newSubmission();
    await expect(resolvers.Mutation.completeSurvey(null, { submissionId, demographics, questionnaire: answers.slice(1) }))
      .rejects.toThrow(/INVALID_QUESTIONNAIRE: missing Q1/);
    const offList = answers.map((a) => (a.questionId === 'Q8' ? { ...a, answer: '同意' } : a));
    await expect(resolvers.Mutation.completeSurvey(null, { submissionId, demographics, questionnaire: offList }))
      .rejects.toThrow(/INVALID_QUESTIONNAIRE: Q8/);
    expect((await SubmissionModel.findById(submissionId).lean()).isCompleted).toBe(false);
  });

  it('rejects a completion without the questionnaire (REQ-416, 2026-11-17)', async () => {
    const submissionId = await newSubmission();
    await expect(resolvers.Mutation.completeSurvey(null, { submissionId, demographics }))
      .rejects.toThrow(/INVALID_QUESTIONNAIRE/);
    expect((await SubmissionModel.findById(submissionId).lean()).isCompleted).toBe(false);
  });
});

describe('a completed submission is final (BUG-012, REQ-402.4)', () => {
  it('rejects a second completeSurvey and changes nothing', async () => {
    const session = await SessionModel.create({ scenarioIds: ['s1'], focalNode: 'A', opponentNode: 'B', sampleSize: 1 });
    const submissionId = String((await SubmissionModel.create({ sessionId: session._id, results: [] }))._id);
    await resolvers.Mutation.completeSurvey(null, { submissionId, demographics, questionnaire: answers });
    const first = await SubmissionModel.findById(submissionId).lean();

    const other = answers.map((a) => ({ ...a, answer: QUESTIONNAIRE.find((q) => q.id === a.questionId).options.find((o) => o !== a.answer) }));
    await expect(resolvers.Mutation.completeSurvey(null, {
      submissionId, demographics: { age: 0, gender: 'X', education: 'attacker@example.com' }, questionnaire: other,
    })).rejects.toThrow(/ALREADY_COMPLETED/);

    const after = await SubmissionModel.findById(submissionId).lean();
    expect(after.demographics).toEqual(first.demographics);
    expect(after.questionnaire).toEqual(answers);
    expect(after.completedAt).toEqual(first.completedAt);
    expect((await SessionModel.findById(session._id).lean()).submissionCount).toBe(1); // not counted twice
  });

  it('still says not found for an unknown submission', async () => {
    await expect(resolvers.Mutation.completeSurvey(null, { submissionId: new mongoose.Types.ObjectId().toString(), demographics, questionnaire: answers }))
      .rejects.toThrow('Submission not found');
  });
});

describe('questionnaire answers are admin-only (REQ-416)', () => {
  it('hides them from submission(id) without an admin login and shows them with one', async () => {
    const submissionId = await newSubmission();
    await resolvers.Mutation.completeSurvey(null, { submissionId, demographics, questionnaire: answers });
    const sub = await resolvers.Query.submission(null, { id: submissionId });
    expect(resolvers.Submission.questionnaire(sub, {}, { isAdmin: false })).toBeNull();
    expect(resolvers.Submission.questionnaire(sub, {}, {})).toBeNull();
    expect(resolvers.Submission.questionnaire(sub, {}, { isAdmin: true })).toEqual(answers);
  });

  it('hides the code and email (demographics) the same way (REQ-408.8)', async () => {
    const submissionId = await newSubmission();
    await resolvers.Mutation.completeSurvey(null, { submissionId, demographics, questionnaire: answers });
    const sub = await resolvers.Query.submission(null, { id: submissionId });
    expect(resolvers.Submission.demographics(sub, {}, {})).toBeNull();
    expect(resolvers.Submission.demographics(sub, {}, { isAdmin: true })).toMatchObject({ gender: 'CODE1', education: 'a@example.com' });
  });
});
