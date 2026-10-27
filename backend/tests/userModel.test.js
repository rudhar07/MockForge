import { describe, it, expect } from 'vitest';
import User from '../src/models/User.js';

const createUser = () =>
  User.create({ name: 'Carol', email: 'carol@test.dev', password: 'secret123' });

describe('User pre-save hook', () => {
  it('hashes the password on create', async () => {
    const user = await createUser();

    expect(user.password).not.toBe('secret123');
    expect(await user.matchPassword('secret123')).toBe(true);
  });

  it('saves a non-password change without re-hashing', async () => {
    // Regression: under Mongoose 9 this threw "next is not a function".
    const user = await createUser();
    const originalHash = user.password;

    user.name = 'Carol Renamed';
    await user.save();

    const reloaded = await User.findById(user._id);
    expect(reloaded.name).toBe('Carol Renamed');
    expect(reloaded.password).toBe(originalHash);
    expect(await reloaded.matchPassword('secret123')).toBe(true);
  });

  it('re-hashes when the password itself changes', async () => {
    const user = await createUser();

    user.password = 'new-password';
    await user.save();

    const reloaded = await User.findById(user._id);
    expect(await reloaded.matchPassword('new-password')).toBe(true);
    expect(await reloaded.matchPassword('secret123')).toBe(false);
  });
});
