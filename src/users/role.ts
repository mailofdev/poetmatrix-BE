export enum Role {
  Reader = 'reader',
  Writer = 'writer',
  SuperAdmin = 'superAdmin',
}

export const SELF_SERVICE_ROLES = [Role.Reader, Role.Writer] as const;

export function registrationRole(requested?: string): Role {
  if (!requested) {
    return Role.Reader;
  }
  if (
    requested === Role.Reader ||
    requested === Role.Writer
  ) {
    return requested;
  }
  throw new Error('Registration cannot assign this role');
}
