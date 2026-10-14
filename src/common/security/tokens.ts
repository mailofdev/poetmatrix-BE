import { createHash, randomBytes } from 'node:crypto';

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export type RefreshState = 'invalid' | 'reuse' | 'expired' | 'rotate';

export function decideRefresh(
  token: { revokedAt: Date | null; expiresAt: Date } | null,
  now: Date,
): RefreshState {
  if (!token) {
    return 'invalid';
  }
  if (token.revokedAt) {
    return 'reuse';
  }
  if (token.expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }
  return 'rotate';
}
