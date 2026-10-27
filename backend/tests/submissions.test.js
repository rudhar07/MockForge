import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Question from '../src/models/Questions.js';
import Submission from '../src/models/Submission.js';
import { createUserWithToken } from './helpers.js';

describe('submission routes', () => {
  let candidate;
  let question;

  beforeEach(async () => {
    // No AI key → the review comes back as "unavailable" without any network call.
    vi.stubEnv('OPENROUTER_API_KEY', '');
    candidate = await createUserWithToken('user');
    const admin = await createUserWithToken('admin');
    question = await Question.create({
      title: 'Array access',
      description: 'Complexity of arr[i]?',
      type: 'mcq',
      topic: 'arrays',
      difficulty: 'easy',
      options: ['O(1)', 'O(n)'],
      correctAnswer: 'O(1)',
      marks: 10,
      createdBy: admin.user._id,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const submit = (body) =>
    request(app).post('/api/submissions').set('Authorization', candidate.auth).send(body);

  it('grades on the server and saves the attempt for the logged-in user', async () => {
    const res = await submit({
      topic: 'arrays',
      responses: [{ questionId: question._id.toString(), selectedOption: 'O(1)' }],
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ score: 10, totalPossible: 10 });
    expect(res.body.aiReview.status).toBe('unavailable');
    const saved = await Submission.findOne({});
    expect(saved.user.toString()).toBe(candidate.user._id.toString());
  });

  it('keeps the existing error messages for bad input', async () => {
    const noTopic = await submit({ responses: [] });
    const badResponses = await submit({ topic: 'arrays', responses: 'oops' });
    const badFlags = await submit({ topic: 'arrays', flaggedQuestionIds: 'oops' });

    expect(noTopic.status).toBe(400);
    expect(noTopic.body.message).toBe('Topic is required');
    expect(badResponses.body.message).toBe('Responses must be an array');
    expect(badFlags.body.message).toBe('Flagged question ids must be an array');
    expect(await Submission.countDocuments()).toBe(0);
  });

  it('does not let a client choose whose attempt it saves', async () => {
    const other = await createUserWithToken('user');

    await submit({ topic: 'arrays', responses: [], user: other.user._id.toString() });

    const saved = await Submission.findOne({});
    expect(saved.user.toString()).toBe(candidate.user._id.toString());
  });

  it('returns only your own history', async () => {
    const other = await createUserWithToken('user');
    await submit({ topic: 'arrays', responses: [] });
    await request(app)
      .post('/api/submissions')
      .set('Authorization', other.auth)
      .send({ topic: 'arrays', responses: [] });

    const res = await request(app).get('/api/submissions/history').set('Authorization', candidate.auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user).toBe(candidate.user._id.toString());
  });
});
