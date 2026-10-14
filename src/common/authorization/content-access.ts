import { Role } from '../../users/role.js';
import { resolveActor } from '../../users/account-rules.js';
import type { AuthUser } from '../types/auth-user.js';
import { canMutatePiece, canReadPiece } from '../../content/content-rules.js';

export const PUBLISHED = 'published';

type ReadableContent = {
  saveAs: string;
  visibility?: string;
  authorId: string | null;
};

function actorOf(user: AuthUser | null) {
  if (!user) {
    return 'guest' as const;
  }
  return resolveActor(user);
}

export function canReadContent(
  content: ReadableContent,
  user: AuthUser | null,
): boolean {
  const visibility =
    content.visibility ??
    (content.saveAs === PUBLISHED ? 'public' : 'private');
  return canReadPiece(
    { status: content.saveAs, visibility, authorId: content.authorId },
    actorOf(user),
    user?.id ?? null,
  );
}

export function canMutateContent(
  content: ReadableContent,
  user: AuthUser | null,
): boolean {
  return canMutatePiece(content.authorId, actorOf(user), user?.id ?? null);
}

export function canAssignRole(input: {
  actor: AuthUser;
  target: { id: string; role: Role };
  nextRole: Role;
  superAdminCount: number;
}): boolean {
  if (resolveActor(input.actor) !== 'superadmin') {
    return false;
  }
  if (input.actor.id === input.target.id) {
    return false;
  }
  if (
    input.target.role === Role.SuperAdmin &&
    input.nextRole !== Role.SuperAdmin &&
    input.superAdminCount <= 1
  ) {
    return false;
  }
  return true;
}
