export enum Role {
  Reader = 'reader',
  Writer = 'writer',
  Admin = 'admin',
  SuperAdmin = 'superadmin',
}

export enum Mode {
  Reader = 'reader',
  Writer = 'writer',
}

export enum Plan {
  Free = 'free',
  Basic = 'basic',
  Pro = 'pro',
}

export type Actor = 'guest' | 'reader' | 'writer' | 'superadmin';

export type AccountSnapshot = {
  id: string;
  role: string;
  mode: string;
  writerSubscription: boolean;
};

export function normalizeRole(role: string): Role {
  if (role === 'superAdmin' || role === Role.SuperAdmin) {
    return Role.SuperAdmin;
  }
  if (role === Role.Admin) {
    return Role.Admin;
  }
  if (role === Role.Writer) {
    return Role.Writer;
  }
  return Role.Reader;
}

export function isAdminRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === Role.Admin || normalized === Role.SuperAdmin;
}

export function resolveActor(account: AccountSnapshot | null): Actor {
  if (!account) {
    return 'guest';
  }
  if (isAdminRole(account.role)) {
    return 'superadmin';
  }
  if (account.mode === Mode.Writer && account.writerSubscription) {
    return 'writer';
  }
  return 'reader';
}

export function registrationDefaults() {
  return {
    role: Role.Reader,
    roles: [Role.Reader],
    mode: Mode.Reader,
    readerSubscription: true,
    writerSubscription: false,
    plan: Plan.Free,
  };
}

export function rejectSelfServiceRole(requested?: string): void {
  if (requested && requested !== Role.Reader) {
    throw new Error('Registration cannot assign this role');
  }
}

const PHONE_PATTERN = /^[0-9+\- ]{8,20}$/;

export type BecomeWriterInput = {
  fullName: string;
  penName: string;
  bio: string;
  phone?: string;
  gender: string;
};

export function validateBecomeWriter(
  actor: AccountSnapshot,
  input: BecomeWriterInput,
): string | null {
  if (isAdminRole(actor.role)) {
    return 'Admin accounts cannot use become-writer';
  }
  if (input.fullName.trim().length < 2 || input.penName.trim().length < 2) {
    return 'Full name and pen name must be at least 2 characters';
  }
  if (input.bio.length > 500) {
    return 'Bio must be at most 500 characters';
  }
  if (!input.gender.trim()) {
    return 'Gender is required';
  }
  if (input.phone && !PHONE_PATTERN.test(input.phone)) {
    return 'Phone must be 8–20 characters from digits, plus, hyphen, and spaces';
  }
  return null;
}

export function becomeWriterPatch(currentPlan: string) {
  return {
    role: Role.Writer,
    roles: [Role.Reader, Role.Writer],
    mode: Mode.Writer,
    readerSubscription: true,
    writerSubscription: true,
    plan: normalizePlan(currentPlan),
  };
}

export function normalizePlan(plan: string): Plan {
  if (plan === Plan.Pro || plan === 'elite') {
    return Plan.Pro;
  }
  if (
    plan === Plan.Basic ||
    plan === 'reader_to_writer' ||
    plan === 'starter' ||
    plan === 'premium'
  ) {
    return Plan.Basic;
  }
  return Plan.Free;
}

export function canSwitchMode(
  account: AccountSnapshot,
  next: Mode,
): boolean {
  if (isAdminRole(account.role)) {
    return false;
  }
  if (next === Mode.Writer) {
    return account.writerSubscription;
  }
  return next === Mode.Reader;
}

export function ownerBillingChangeRejected(
  actorId: string,
  targetId: string,
): boolean {
  return actorId === targetId;
}

export function safeNextPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return '/library';
  }
  if (
    value.startsWith('//') ||
    value.startsWith('/\\') ||
    value.includes('://')
  ) {
    return '/library';
  }
  if (value.startsWith('/login') || value.startsWith('/register')) {
    return '/library';
  }
  return value;
}

export function toPublicProfile(user: {
  id: string;
  displayName: string | null;
  penName: string | null;
  bio: string | null;
  photoPath: string | null;
  writerSubscription: boolean;
}) {
  return {
    id: user.id,
    displayName: user.displayName,
    penName: user.penName,
    bio: user.bio,
    photo: user.photoPath,
    writer: user.writerSubscription,
  };
}
