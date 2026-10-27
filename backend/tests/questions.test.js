import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Question from '../src/models/Questions.js';
import { createUserWithToken } from './helpers.js';

const mcq = {
  title: 'Array access',
  description: 'What is the time complexity of reading arr[i]?',
  type: 'mcq',
  topic: 'arrays',
  difficulty: 'easy',
  options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
  correctAnswer: 'O(1)',
  explanation: 'Arrays are contiguous, so the address is computed directly.',
  marks: 10,
};

const codeQuestion = {
  title: 'Sum two numbers',
  description: 'Read two integers and print their sum.',
  type: 'code',
  topic: 'arrays',
  difficulty: 'easy',
  language: 'python',
  starterCode: '',
  testCases: [
    { input: '1 2', expectedOutput: '3', isSample: true },
    // Distinctive values, so the leak check below can't match by accident
    // (a plain "42" also shows up inside random ObjectIds now and then).
    { input: 'HIDDEN_INPUT_7f3a', expectedOutput: 'HIDDEN_OUTPUT_7f3a', isSample: false },
  ],
};

const MISSING_ID = '507f1f77bcf86cd799439011';

describe('question routes', () => {
  let admin;
  let candidate;

  beforeEach(async () => {
    admin = await createUserWithToken('admin');
    candidate = await createUserWithToken('user');
  });

  it('lets an admin create a question', async () => {
    const res = await request(app).post('/api/questions').set('Authorization', admin.auth).send(mcq);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Array access', correctAnswer: 'O(1)' });
    expect(res.body.createdBy).toBe(admin.user._id.toString());
  });

  it('rejects a question without a title with a 400 instead of a 500', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', admin.auth)
      .send({ ...mcq, title: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title is required');
  });

  it('rejects an unknown topic', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', admin.auth)
      .send({ ...mcq, topic: 'cooking' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Topic must be one of: arrays, dp, graphs, oop');
  });

  it('surfaces model rules as a 400 (code question without test cases)', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', admin.auth)
      .send({ ...codeQuestion, testCases: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Code questions require at least one test case.');
  });

  it('ignores a client-supplied createdBy', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', admin.auth)
      .send({ ...mcq, createdBy: candidate.user._id });

    expect(res.body.createdBy).toBe(admin.user._id.toString());
  });

  it('returns 400 for a malformed id and 404 for a missing one', async () => {
    const malformed = await request(app).get('/api/questions/abc').set('Authorization', admin.auth);
    const missing = await request(app)
      .get(`/api/questions/${MISSING_ID}`)
      .set('Authorization', admin.auth);

    expect(malformed.status).toBe(400);
    expect(malformed.body.message).toBe('Invalid question id');
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('Question not found');
  });

  it('updates and deletes a question', async () => {
    const { body: created } = await request(app)
      .post('/api/questions')
      .set('Authorization', admin.auth)
      .send(mcq);

    const updated = await request(app)
      .put(`/api/questions/${created._id}`)
      .set('Authorization', admin.auth)
      .send({ ...mcq, title: 'Array indexing' });
    const deleted = await request(app)
      .delete(`/api/questions/${created._id}`)
      .set('Authorization', admin.auth);

    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('Array indexing');
    expect(deleted.status).toBe(200);
    expect(await Question.countDocuments()).toBe(0);
  });

  it('never sends answers or hidden test cases to candidates', async () => {
    await request(app).post('/api/questions').set('Authorization', admin.auth).send(mcq);
    await request(app).post('/api/questions').set('Authorization', admin.auth).send(codeQuestion);

    const res = await request(app).get('/api/questions/topic/arrays').set('Authorization', candidate.auth);

    const sentMcq = res.body.find((q) => q.type === 'mcq');
    const sentCode = res.body.find((q) => q.type === 'code');
    expect(sentMcq.correctAnswer).toBeUndefined();
    expect(sentMcq.explanation).toBeUndefined();
    expect(sentCode.testCases).toBeUndefined();
    expect(sentCode.sampleTestCases).toEqual([{ input: '1 2', expectedOutput: '3' }]);
    expect(sentCode.hiddenTestCount).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain('HIDDEN_');
  });
});
