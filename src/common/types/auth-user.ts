import { Role } from '../../users/role.js';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type PublicUser = AuthUser & {
  createdAt: Date;
};
