import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { createUserWithToken } from './helpers.js';

// Every request from Supertest comes from 127.0.0.1. With `trust proxy` set,
// Express takes the client address from X-Forwarded-For instead — exactly
// what Render's proxy sends — so tests can play different visitors.
const from = (ip, req) => req.set('X-Forwarded-For', ip);

const failedLogin = (ip = '203.0.113.1') =>
  from(ip, request(app).post('/api/auth/login')).send({
    email: 'nobody@test.dev',
    password: 'wrong',
  });

// Fire `count` requests one after another (rate limits are about order).
const repeat = async (count, makeRequest) => {
  const responses = [];
  for (let i = 0; i < count; i += 1) {
    responses.push(await makeRequest(i));
  }
  return responses;
};

describe('rate limiting', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('RAPIDAPI_KEY', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('blocks the 11th failed login from the same IP with a 429', async () => {
    const attempts = await repeat(10, () => failedLogin());
    const blocked = await failedLogin();

    expect(attempts.every((res) => res.status === 401)).toBe(true);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toBe('Too many failed login attempts. Please try again in 15 minutes.');
    expect(blocked.headers['ratelimit-policy']).toBeDefined();
  });

  it('counts each client IP separately (trust proxy works)', async () => {
    await repeat(10, () => failedLogin('203.0.113.1'));

    const sameVisitor = await failedLogin('203.0.113.1');
    const otherVisitor = await failedLogin('198.51.100.7');

    expect(sameVisitor.status).toBe(429);
    expect(otherVisitor.status).toBe(401);
  });

  it('does not count successful logins', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ana', email: 'ana@test.dev', password: 'secret123' });

    const logins = await repeat(15, () =>
      request(app).post('/api/auth/login').send({ email: 'ana@test.dev', password: 'secret123' })
    );

    expect(logins.every((res) => res.status === 200)).toBe(true);
  });

  it('allows 5 sign-ups per hour from one IP', async () => {
    const signUps = await repeat(6, (i) =>
      request(app)
        .post('/api/auth/register')
        .send({ name: 'User', email: `user${i}@test.dev`, password: 'secret123' })
    );

    expect(signUps.slice(0, 5).every((res) => res.status === 201)).toBe(true);
    expect(signUps[5].status).toBe(429);
  });

  it('limits code runs per user, not per IP', async () => {
    const alice = await createUserWithToken('user');
    const bob = await createUserWithToken('user');
    const run = (who) =>
      request(app)
        .post('/api/execute/run')
        .set('Authorization', who.auth)
        .send({ language: 'python', code: 'print(1)' });

    await repeat(20, () => run(alice));
    const aliceBlocked = await run(alice);
    const bobAllowed = await run(bob); // same IP as Alice

    expect(aliceBlocked.status).toBe(429);
    expect(bobAllowed.status).toBe(200);
  });

  it('caps the whole API per IP but never limits /health', async () => {
    await repeat(300, () => request(app).get('/api/does-not-exist'));

    const api = await request(app).get('/api/does-not-exist');
    const health = await request(app).get('/health');

    expect(api.status).toBe(429);
    expect(health.status).toBe(200);
  });
});
