import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../src/middleware/validate.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { idParams } from '../src/validation/common.js';

// A throwaway app that echoes back what the controller would receive.
const testApp = express();
testApp.use(express.json());
testApp.post(
  '/items/:id',
  validate({
    params: idParams('item id'),
    body: z.object({ name: z.string().trim().min(1, 'Name is required') }),
  }),
  (req, res) => res.json({ body: req.body })
);
testApp.use(errorHandler);

const VALID_ID = '507f1f77bcf86cd799439011';

describe('validate middleware', () => {
  it('passes parsed, trimmed data to the controller', async () => {
    const res = await request(testApp).post(`/items/${VALID_ID}`).send({ name: '  Pen  ' });

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: 'Pen' });
  });

  it('strips keys the schema does not declare', async () => {
    const res = await request(testApp)
      .post(`/items/${VALID_ID}`)
      .send({ name: 'Pen', role: 'admin' });

    expect(res.body.body).toEqual({ name: 'Pen' });
  });

  it('rejects an invalid body with a 400 and per-field errors', async () => {
    const res = await request(testApp).post(`/items/${VALID_ID}`).send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: 'Name is required',
      errors: [{ path: 'name', message: 'Name is required' }],
    });
  });

  it('rejects a malformed id before the controller runs', async () => {
    const res = await request(testApp).post('/items/not-an-id').send({ name: 'Pen' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid item id');
  });
});
