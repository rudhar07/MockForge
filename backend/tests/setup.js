import { beforeAll, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resetRateLimits } from '../src/middleware/rateLimiters.js';

// Each test file gets its own throwaway MongoDB that lives in memory, so tests
// never touch Atlas or your local Docker database.
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

// Wipe every collection and rate-limit counter between tests so each test
// starts fresh and can't depend on what another one left behind.
afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await resetRateLimits();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
