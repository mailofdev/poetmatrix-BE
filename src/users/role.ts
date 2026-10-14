import { Role } from './account-rules.js';

export { Mode, Plan, Role } from './account-rules.js';

export function registrationRole(requested?: string): Role {
  if (!requested || requested === Role.Reader) {
    return Role.Reader;
  }
  throw new Error('Registration cannot assign this role');
}
