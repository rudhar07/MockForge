import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { createUserWithToken } from './helpers.js';

describe('POST /api/execute/run', () => {
  let candidate;

  beforeEach(async () => {
    // No Judge0 key → executeCode returns an error result without calling out.
    vi.stubEnv('RAPIDAPI_KEY', '');
    candidate = await createUserWithToken('user');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const run = (body) =>
    request(app).post('/api/execute/run').set('Authorization', candidate.auth).send(body);

  it('passes valid code to the executor and returns its result', async () => {
    const res = await run({ language: 'python', code: 'print(1)' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'RAPIDAPI_KEY is not configured on the server.',
    });
  });

  it.each([
    [{ language: 'cobol', code: 'x' }, 'language must be one of: python, javascript, cpp, java, c'],
    [{ language: 'python', code: '   ' }, 'code must be a non-empty string'],
    [{ language: 'python' }, 'code must be a non-empty string'],
    [{ language: 'python', code: 'x'.repeat(50_001) }, 'code exceeds 50KB limit'],
    [{ language: 'python', code: 'x', stdin: 42 }, 'stdin must be a string'],
  ])('rejects invalid input %#', async (body, message) => {
    const res = await run(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
  });
});
