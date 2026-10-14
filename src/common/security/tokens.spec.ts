import { decideRefresh } from './tokens.js';

describe('decideRefresh', () => {
  const now = new Date('2026-10-14T00:00:00.000Z');

  it('rotates a live token', () => {
    expect(
      decideRefresh(
        { revokedAt: null, expiresAt: new Date('2026-10-15T00:00:00.000Z') },
        now,
      ),
    ).toBe('rotate');
  });

  it('treats a missing token as invalid', () => {
    expect(decideRefresh(null, now)).toBe('invalid');
  });

  it('detects reuse of a revoked token', () => {
    expect(
      decideRefresh(
        {
          revokedAt: new Date('2026-10-13T00:00:00.000Z'),
          expiresAt: new Date('2026-10-15T00:00:00.000Z'),
        },
        now,
      ),
    ).toBe('reuse');
  });

  it('rejects an expired token', () => {
    expect(
      decideRefresh(
        { revokedAt: null, expiresAt: new Date('2026-10-13T00:00:00.000Z') },
        now,
      ),
    ).toBe('expired');
  });
});
