import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env.js';

const complete = {
  MONGO_URI: 'mongodb+srv://user:pass@cluster.example.net/mockforge',
  JWT_SECRET: 'a'.repeat(64),
  RAPIDAPI_KEY: 'key',
  OPENROUTER_API_KEY: 'key',
};

describe('validateEnv', () => {
  it('accepts a complete configuration with no warnings', () => {
    expect(validateEnv(complete)).toEqual({ warnings: [] });
  });

  it('accepts a local mongodb:// URI', () => {
    expect(() =>
      validateEnv({ ...complete, MONGO_URI: 'mongodb://localhost:27017/mockforge' })
    ).not.toThrow();
  });

  it('refuses to start without JWT_SECRET', () => {
    expect(() => validateEnv({ ...complete, JWT_SECRET: '' })).toThrow('JWT_SECRET is required');
  });

  it('lists every missing required setting at once', () => {
    expect(() => validateEnv({})).toThrow(
      'Invalid environment configuration:\n  - MONGO_URI is required\n  - JWT_SECRET is required'
    );
  });

  it('rejects a MONGO_URI that is not a MongoDB connection string', () => {
    expect(() => validateEnv({ ...complete, MONGO_URI: 'localhost:27017' })).toThrow(
      'MONGO_URI must start with mongodb:// or mongodb+srv://'
    );
  });

  it('only warns about optional keys and a short secret', () => {
    const { warnings } = validateEnv({ MONGO_URI: complete.MONGO_URI, JWT_SECRET: 'short' });

    expect(warnings).toEqual([
      'RAPIDAPI_KEY is not set — code execution (Judge0) is disabled',
      'OPENROUTER_API_KEY is not set — AI review is disabled',
      'JWT_SECRET is shorter than 32 characters — use a long random value',
    ]);
  });
});
