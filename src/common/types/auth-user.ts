import { Mode, Plan, Role } from '../../users/role.js';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  mode: Mode;
  plan: Plan;
  readerSubscription: boolean;
  writerSubscription: boolean;
};

export type PublicUser = AuthUser & {
  displayName: string | null;
  penName: string | null;
  bio: string | null;
  phone: string | null;
  gender: string | null;
  photo: string | null;
  interests: string[];
  interestsCompleted: boolean;
  pushEnabled: boolean;
  theme: string;
  createdAt: Date;
};
