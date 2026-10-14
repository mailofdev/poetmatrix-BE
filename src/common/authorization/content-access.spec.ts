import { Role } from '../../users/role.js';
import {
  canAssignRole,
  canMutateContent,
  canReadContent,
} from './content-access.js';

const reader = { id: 'reader', email: 'r@example.com', role: Role.Reader };
const writer = { id: 'writer', email: 'w@example.com', role: Role.Writer };
const admin = { id: 'admin', email: 'a@example.com', role: Role.SuperAdmin };

describe('content access', () => {
  const published = { saveAs: 'published', authorId: writer.id };
  const draft = { saveAs: 'draft', authorId: writer.id };
  const orphanDraft = { saveAs: 'draft', authorId: null };

  it('lets anyone read published work', () => {
    expect(canReadContent(published, null)).toBe(true);
  });

  it('hides drafts from other readers and anonymous users', () => {
    expect(canReadContent(draft, null)).toBe(false);
    expect(canReadContent(draft, reader)).toBe(false);
  });

  it('lets the author and a super admin read drafts', () => {
    expect(canReadContent(draft, writer)).toBe(true);
    expect(canReadContent(draft, admin)).toBe(true);
  });

  it('lets only the authoring writer or a super admin change content', () => {
    expect(canMutateContent(draft, null)).toBe(false);
    expect(canMutateContent(draft, reader)).toBe(false);
    expect(canMutateContent(draft, writer)).toBe(true);
    expect(canMutateContent(published, { ...writer, id: 'other' })).toBe(
      false,
    );
    expect(canMutateContent(orphanDraft, admin)).toBe(true);
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
