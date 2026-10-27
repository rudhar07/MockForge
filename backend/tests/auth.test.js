import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

const alice = { name: 'Alice', email: 'alice@test.dev', password: 'secret123' };

describe('GET /health', () => {
  it('responds ok without touching the database', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without the password', async () => {
    const res = await request(app).post('/api/auth/register').send(alice);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Alice', email: 'alice@test.dev', role: 'user' });
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.password).toBeUndefined();
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/register').send(alice);

    const stored = await User.findOne({ email: alice.email });
    expect(stored.password).not.toBe(alice.password);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(alice);
    const res = await request(app).post('/api/auth/register').send(alice);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for correct credentials', async () => {
    await request(app).post('/api/auth/register').send(alice);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: alice.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password', async () => {
    await request(app).post('/api/auth/register').send(alice);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.dev', password: 'whatever' });

    // Same message as a wrong password, so attackers can't probe which emails exist.
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
