import { Mode, Plan, Role } from '../../users/role.js';
import {
  canAssignRole,
  canMutateContent,
  canReadContent,
} from './content-access.js';

const reader = {
  id: 'reader',
  email: 'r@example.com',
  role: Role.Reader,
  mode: Mode.Reader,
  plan: Plan.Free,
  readerSubscription: true,
  writerSubscription: false,
};
const writer = {
  id: 'writer',
  email: 'w@example.com',
  role: Role.Writer,
  mode: Mode.Writer,
  plan: Plan.Free,
  readerSubscription: true,
  writerSubscription: true,
};
const admin = {
  id: 'admin',
  email: 'a@example.com',
  role: Role.SuperAdmin,
  mode: Mode.Reader,
  plan: Plan.Free,
  readerSubscription: true,
  writerSubscription: false,
};

describe('content access', () => {
  const published = {
    saveAs: 'published',
    visibility: 'public',
    authorId: writer.id,
  };
  const draft = {
    saveAs: 'draft',
    visibility: 'private',
    authorId: writer.id,
  };
  const premium = {
    saveAs: 'published',
    visibility: 'premium',
    authorId: writer.id,
  };

  it('lets anyone read published public work', () => {
    expect(canReadContent(published, null)).toBe(true);
  });

  it('hides private and premium work from guests and other readers', () => {
    expect(canReadContent(draft, null)).toBe(false);
    expect(canReadContent(premium, null)).toBe(false);
    expect(canReadContent(draft, reader)).toBe(false);
    expect(canReadContent(premium, reader)).toBe(false);
  });

  it('lets the owner and a superadmin read private work', () => {
    expect(canReadContent(draft, writer)).toBe(true);
    expect(canReadContent(draft, admin)).toBe(true);
  });

  it('closes writer edits while the author is in reader mode', () => {
    expect(canMutateContent(draft, null)).toBe(false);
    expect(canMutateContent(draft, reader)).toBe(false);
    expect(
      canMutateContent(draft, { ...writer, mode: Mode.Reader }),
    ).toBe(false);
    expect(canMutateContent(draft, writer)).toBe(true);
    expect(canMutateContent(published, { ...writer, id: 'other' })).toBe(
      false,
    );
    expect(canMutateContent(draft, admin)).toBe(true);
  });

  it('blocks privilege changes that lock out administration', () => {
    expect(
      canAssignRole({
        actor: admin,
        target: { id: 'other-admin', role: Role.SuperAdmin },
        nextRole: Role.Reader,
        superAdminCount: 1,
      }),
    ).toBe(false);
    expect(
      canAssignRole({
        actor: admin,
        target: admin,
        nextRole: Role.Writer,
        superAdminCount: 2,
      }),
    ).toBe(false);
    expect(
      canAssignRole({
        actor: writer,
        target: reader,
        nextRole: Role.Writer,
        superAdminCount: 1,
      }),
    ).toBe(false);
    expect(
      canAssignRole({
        actor: admin,
        target: reader,
        nextRole: Role.Writer,
        superAdminCount: 1,
      }),
    ).toBe(true);
  });
});
