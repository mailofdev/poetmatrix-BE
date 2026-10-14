import { describe, expect, it } from 'vitest';
import {
  becomeWriterPatch,
  canSwitchMode,
  normalizePlan,
  ownerBillingChangeRejected,
  registrationDefaults,
  resolveActor,
  safeNextPath,
  toPublicProfile,
  validateBecomeWriter,
  Mode,
  Plan,
  Role,
} from './account-rules.js';
import { registrationRole } from './role.js';

const reader = {
  id: 'reader',
  role: Role.Reader,
  mode: Mode.Reader,
  writerSubscription: false,
};

describe('actor resolution', () => {
  it('treats a missing session as a guest', () => {
    expect(resolveActor(null)).toBe('guest');
  });

  it('treats admin and superadmin as superadmin regardless of mode', () => {
    expect(
      resolveActor({
        ...reader,
        role: 'admin',
        mode: Mode.Reader,
      }),
    ).toBe('superadmin');
    expect(
      resolveActor({
        ...reader,
        role: 'superAdmin',
        mode: Mode.Writer,
        writerSubscription: true,
      }),
    ).toBe('superadmin');
  });

  it('treats a writer in reader mode as a reader', () => {
    expect(
      resolveActor({
        ...reader,
        role: Role.Writer,
        mode: Mode.Reader,
        writerSubscription: true,
      }),
    ).toBe('reader');
  });

  it('requires the writer subscription for writer mode', () => {
    expect(
      resolveActor({
        ...reader,
        role: Role.Writer,
        mode: Mode.Writer,
        writerSubscription: false,
      }),
    ).toBe('reader');
    expect(
      resolveActor({
        ...reader,
        role: Role.Writer,
        mode: Mode.Writer,
        writerSubscription: true,
      }),
    ).toBe('writer');
  });
});

describe('registration and upgrade', () => {
  it('creates a reader with the free plan', () => {
    expect(registrationDefaults()).toEqual({
      role: Role.Reader,
      roles: [Role.Reader],
      mode: Mode.Reader,
      readerSubscription: true,
      writerSubscription: false,
      plan: Plan.Free,
    });
    expect(registrationRole()).toBe(Role.Reader);
    expect(() => registrationRole(Role.Writer)).toThrow(/cannot assign/i);
  });

  it('rejects admins and incomplete become-writer forms', () => {
    const form = {
      fullName: 'Ada Lovelace',
      penName: 'Ada',
      bio: 'Notes',
      gender: 'woman',
    };
    expect(
      validateBecomeWriter({ ...reader, role: Role.Admin }, form),
    ).toMatch(/admin/i);
    expect(validateBecomeWriter(reader, { ...form, fullName: 'A' })).toMatch(
      /2 characters/,
    );
    expect(validateBecomeWriter(reader, { ...form, bio: 'x'.repeat(501) })).toMatch(
      /500/,
    );
    expect(validateBecomeWriter(reader, { ...form, phone: '12' })).toMatch(
      /Phone/,
    );
    expect(validateBecomeWriter(reader, form)).toBeNull();
    expect(becomeWriterPatch('elite').plan).toBe(Plan.Pro);
    expect(becomeWriterPatch('').plan).toBe(Plan.Free);
  });

  it('maps legacy plan names', () => {
    expect(normalizePlan('starter')).toBe(Plan.Basic);
    expect(normalizePlan('premium')).toBe(Plan.Basic);
    expect(normalizePlan('reader_to_writer')).toBe(Plan.Basic);
    expect(normalizePlan('elite')).toBe(Plan.Pro);
  });
});

describe('owner and redirect rules', () => {
  it('stops an owner changing their own billing', () => {
    expect(ownerBillingChangeRejected('same', 'same')).toBe(true);
    expect(ownerBillingChangeRejected('admin', 'other')).toBe(false);
  });

  it('allows writer mode only with the subscription flag', () => {
    expect(canSwitchMode(reader, Mode.Writer)).toBe(false);
    expect(
      canSwitchMode({ ...reader, writerSubscription: true }, Mode.Writer),
    ).toBe(true);
    expect(canSwitchMode({ ...reader, role: Role.Admin }, Mode.Reader)).toBe(
      false,
    );
  });

  it('keeps redirects on this site', () => {
    expect(safeNextPath('/library')).toBe('/library');
    expect(safeNextPath('//evil.example')).toBe('/library');
    expect(safeNextPath('https://evil.example')).toBe('/library');
    expect(safeNextPath('/\\evil')).toBe('/library');
  });

  it('hides email, phone, and role on a public profile', () => {
    const profile = toPublicProfile({
      id: '1',
      displayName: 'Ada',
      penName: 'A',
      bio: 'Notes',
      photoPath: '/uploads/a.jpg',
      writerSubscription: true,
    });
    expect(profile).toEqual({
      id: '1',
      displayName: 'Ada',
      penName: 'A',
      bio: 'Notes',
      photo: '/uploads/a.jpg',
      writer: true,
    });
    expect(profile).not.toHaveProperty('email');
    expect(profile).not.toHaveProperty('phone');
    expect(profile).not.toHaveProperty('role');
  });
});
