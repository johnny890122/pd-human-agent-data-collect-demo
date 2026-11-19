/**
 * completeSurvey (registration code, email, questionnaire — REQ-403, REQ-416, BUG-015) and startSurvey
 * (consent REQ-417, device REQ-418): stored, validated, admin-only.
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
const contact = { registrationCode: 'CODE1', email: 'a@example.com' };
// true = first option (同意 / 好 / 管制); alternate so both values are exercised
const answers = QUESTIONNAIRE.map((q, i) => ({ questionId: q.id, answer: i % 2 === 0 }));
const consent = { consentedAt: '2026-11-18T10:00:00.000Z', version: 'welcome-test' };
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const participantCtx = { isTurnstileVerified: true, userAgent: PHONE_UA, mobileHint: '?1' };

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
const newSession = () => SessionModel.create({ scenarioIds: ['s1'], focalNode: 'A', opponentNode: 'B', sampleSize: 5 });
const complete = (submissionId, extra = {}) => resolvers.Mutation.completeSurvey(null, { submissionId, ...contact, questionnaire: answers, ...extra });

describe('completeSurvey stores code, email and Boolean answers (REQ-403, REQ-416, BUG-015)', () => {
  it('saves them under their own names', async () => {
    const submissionId = await newSubmission();
    await complete(submissionId);
    const saved = await SubmissionModel.findById(submissionId).lean();
    expect(saved.isCompleted).toBe(true);
    expect([saved.registrationCode, saved.email]).toEqual(['CODE1', 'a@example.com']);
    expect(saved.questionnaire).toEqual(answers);
    expect(saved.demographics).toBeUndefined();
  });

  it('rejects an empty code or a malformed email and completes nothing', async () => {
    const submissionId = await newSubmission();
    await expect(complete(submissionId, { registrationCode: '  ' })).rejects.toThrow(/INVALID_CONTACT/);
    await expect(complete(submissionId, { email: 'not-an-email' })).rejects.toThrow(/INVALID_CONTACT/);
    expect((await SubmissionModel.findById(submissionId).lean()).isCompleted).toBe(false);
  });

  it('rejects an incomplete, non-Boolean or missing questionnaire and completes nothing', async () => {
    const submissionId = await newSubmission();
    await expect(complete(submissionId, { questionnaire: answers.slice(1) })).rejects.toThrow(/INVALID_QUESTIONNAIRE: missing Q1/);
    const text = answers.map((a) => (a.questionId === 'Q8' ? { ...a, answer: '管制' } : a));
    await expect(complete(submissionId, { questionnaire: text })).rejects.toThrow(/INVALID_QUESTIONNAIRE: Q8/);
    await expect(complete(submissionId, { questionnaire: undefined })).rejects.toThrow(/INVALID_QUESTIONNAIRE/);
    expect((await SubmissionModel.findById(submissionId).lean()).isCompleted).toBe(false);
  });
});

describe('a completed submission is final (BUG-012, REQ-402.4)', () => {
  it('rejects a second completeSurvey and changes nothing', async () => {
    const session = await newSession();
    const submissionId = String((await SubmissionModel.create({ sessionId: session._id, results: [] }))._id);
    await complete(submissionId);
    const first = await SubmissionModel.findById(submissionId).lean();

    const flipped = answers.map((a) => ({ ...a, answer: !a.answer }));
    await expect(complete(submissionId, { registrationCode: 'X', email: 'attacker@example.com', questionnaire: flipped }))
      .rejects.toThrow(/ALREADY_COMPLETED/);

    const after = await SubmissionModel.findById(submissionId).lean();
    expect([after.registrationCode, after.email]).toEqual([first.registrationCode, first.email]);
    expect(after.questionnaire).toEqual(answers);
    expect(after.completedAt).toEqual(first.completedAt);
    expect((await SessionModel.findById(session._id).lean()).submissionCount).toBe(1); // not counted twice
  });

  it('still says not found for an unknown submission', async () => {
    await expect(complete(new mongoose.Types.ObjectId().toString())).rejects.toThrow('Submission not found');
  });
});

describe('startSurvey records consent and device (REQ-417, REQ-418)', () => {
  it('stores the consent and the device of the request that creates the submission', async () => {
    const session = await newSession();
    const sub = await resolvers.Mutation.startSurvey(null, { sessionId: session._id, participantId: 'p1', consent }, participantCtx);
    const saved = await SubmissionModel.findById(sub._id).lean();
    expect(saved.consentedAt.toISOString()).toBe(consent.consentedAt);
    expect(saved.consentVersion).toBe('welcome-test');
    expect([saved.deviceType, saved.userAgent]).toEqual(['mobile', PHONE_UA]);
  });

  it('refuses to create a submission without consent', async () => {
    const session = await newSession();
    for (const bad of [undefined, { consentedAt: 'yesterday', version: 'v' }, { consentedAt: consent.consentedAt, version: ' ' }]) {
      await expect(resolvers.Mutation.startSurvey(null, { sessionId: session._id, participantId: 'p1', consent: bad }, participantCtx))
        .rejects.toThrow(/CONSENT_REQUIRED/);
    }
    expect(await SubmissionModel.countDocuments({})).toBe(0);
  });

  it('resumes an existing submission without asking again and keeps the first record', async () => {
    const session = await newSession();
    const first = await resolvers.Mutation.startSurvey(null, { sessionId: session._id, participantId: 'p1', consent }, participantCtx);
    const again = await resolvers.Mutation.startSurvey(null, { sessionId: session._id, participantId: 'p1' },
      { isTurnstileVerified: true, userAgent: 'Desktop Chrome', mobileHint: '?0' });
    expect(again._id).toBe(first._id);
    expect((await SubmissionModel.findById(first._id).lean()).deviceType).toBe('mobile');
  });
});

describe('participant data is admin-only (REQ-408.8, REQ-416, REQ-417, REQ-418)', () => {
  it('hides every personal field from submission(id) without an admin login', async () => {
    const session = await newSession();
    const { _id } = await resolvers.Mutation.startSurvey(null, { sessionId: session._id, participantId: 'p1', consent }, participantCtx);
    await complete(_id);
    const sub = await resolvers.Query.submission(null, { id: _id });
    const fields = ['registrationCode', 'email', 'questionnaire', 'consentedAt', 'consentVersion', 'deviceType', 'userAgent'];
    for (const f of fields) {
      expect(resolvers.Submission[f](sub, {}, {})).toBeNull();
      expect(resolvers.Submission[f](sub, {}, { isAdmin: false })).toBeNull();
    }
    expect(Object.fromEntries(fields.map((f) => [f, resolvers.Submission[f](sub, {}, { isAdmin: true })]))).toEqual({
      ...contact, questionnaire: answers, consentedAt: consent.consentedAt, consentVersion: 'welcome-test', deviceType: 'mobile', userAgent: PHONE_UA,
    });
  });
});
