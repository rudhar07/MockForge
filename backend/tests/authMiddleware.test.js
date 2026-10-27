import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import generateToken from '../src/utils/generateToken.js';

// Any route behind `protect` works; history is a simple read-only one.
const PROTECTED = '/api/submissions/history';

const createUser = () =>
  User.create({ name: 'Bob', email: 'bob@test.dev', password: 'secret123' });

describe('protect middleware', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get(PROTECTED);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token provided');
  });

  it('rejects a bare "Bearer" header with a single 401', async () => {
    // Regression: this used to send two responses and crash with
    // "Cannot set headers after they are sent".
    const res = await request(app).get(PROTECTED).set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token provided');
  });

  it('rejects a token that is not a valid JWT', async () => {
    const res = await request(app).get(PROTECTED).set('Authorization', 'Bearer not-a-jwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, token failed or expired');
  });

  it('rejects a valid token for a user that was deleted', async () => {
    // Regression: this used to pass through with req.user = null.
    const user = await createUser();
    const token = generateToken(user._id);
    await user.deleteOne();

    const res = await request(app).get(PROTECTED).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, user no longer exists');
  });

  it('lets a valid token for an existing user through', async () => {
    const user = await createUser();
    const token = generateToken(user._id);

    const res = await request(app).get(PROTECTED).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('admin middleware', () => {
  it('blocks a logged-in non-admin from admin routes', async () => {
    const user = await createUser();
    const token = generateToken(user._id);

    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(403);
  });
});
