import { registrationRole, Role } from './role.js';

describe('registrationRole', () => {
  it('defaults to reader', () => {
    expect(registrationRole()).toBe(Role.Reader);
  });

  it('rejects writer and super admin registration', () => {
    expect(() => registrationRole(Role.Writer)).toThrow(/cannot assign/i);
    expect(() => registrationRole(Role.SuperAdmin)).toThrow(/cannot assign/i);
  });
});
