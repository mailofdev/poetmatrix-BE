import { registrationRole, Role } from './role.js';

describe('registrationRole', () => {
  it('defaults to reader', () => {
    expect(registrationRole()).toBe(Role.Reader);
  });

  it('allows reader and writer', () => {
    expect(registrationRole(Role.Writer)).toBe(Role.Writer);
  });

  it('rejects super admin registration', () => {
    expect(() => registrationRole(Role.SuperAdmin)).toThrow(
      /cannot assign/i,
    );
  });
});
