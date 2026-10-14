import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the original password and rejects a different one', async () => {
    const hashed = await hashPassword('correct-horse-1');
    expect(hashed.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hashed, 'correct-horse-1')).toBe(true);
    expect(await verifyPassword(hashed, 'wrong-horse-1')).toBe(false);
    expect(await verifyPassword('not-a-hash', 'correct-horse-1')).toBe(false);
  });
});
