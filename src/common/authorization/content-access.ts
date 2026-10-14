import { Role } from '../../users/role.js';
import type { AuthUser } from '../types/auth-user.js';

export const PUBLISHED = 'published';

type ReadableContent = {
  saveAs: string;
  authorId: string | null;
};

export function canReadContent(
  content: ReadableContent,
  user: AuthUser | null,
): boolean {
  if (content.saveAs === PUBLISHED) {
    return true;
  }
  if (!user) {
    return false;
  }
  if (user.role === Role.SuperAdmin) {
    return true;
  }
  return content.authorId === user.id;
}

export function canMutateContent(
  content: ReadableContent,
  user: AuthUser | null,
): boolean {
  if (!user) {
    return false;
  }
  if (user.role === Role.SuperAdmin) {
    return true;
  }
  return user.role === Role.Writer && content.authorId === user.id;
}

export function canAssignRole(input: {
  actor: AuthUser;
  target: { id: string; role: Role };
  nextRole: Role;
  superAdminCount: number;
}): boolean {
  if (input.actor.role !== Role.SuperAdmin) {
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
