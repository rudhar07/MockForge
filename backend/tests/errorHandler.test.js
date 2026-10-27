import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import HttpError from '../src/utils/HttpError.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// A throwaway app with one async route that fails however the test wants,
// so we can check how the real errorHandler responds to each kind of error.
const appThatThrows = (makeError) => {
  const testApp = express();
  testApp.get('/boom', async () => {
    throw await makeError();
  });
  testApp.use(errorHandler);
  return testApp;
};

describe('errorHandler', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the status and message of an HttpError', async () => {
    const res = await request(appThatThrows(() => new HttpError(404, 'Question not found'))).get('/boom');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Question not found' });
  });

  it('turns a Mongoose validation error into a 400 listing each field', async () => {
    const makeError = () => new User({}).validate().catch((err) => err);

    const res = await request(appThatThrows(makeError)).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body.message).toEqual(expect.any(String));
    expect(res.body.errors.map((e) => e.path).sort()).toEqual(['email', 'name', 'password']);
  });

  it('returns 500 with the real message outside production', async () => {
    const res = await request(appThatThrows(() => new Error('db exploded'))).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('db exploded');
  });

  it('hides internal error messages in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(appThatThrows(() => new Error('db exploded'))).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
    expect(spy).toHaveBeenCalled(); // still logged for us to debug
    spy.mockRestore();
  });
});

describe('app-level error responses', () => {
  it('returns a JSON 404 for an unknown API route', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found: GET /api/does-not-exist');
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Request body is not valid JSON');
  });
});
