import type { StaffRole, StaffUser } from '../../src/types';
import type { User } from '../generated/prisma';

/** Auth/list responses never need password hashes — accept a lean user row. */
export type MappableUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'mobile'
  | 'designation'
  | 'role'
  | 'avatarColor'
  | 'status'
  | 'permissions'
  | 'createdAt'
> & {
  lastLoginAt?: Date | null;
};

export function mapDbUserToStaffUser(user: MappableUser): StaffUser {
  return {
    id: user.id,
    name: user.name,
    designation: user.designation,
    role: user.role as StaffRole,
    mobile: user.mobile ?? '',
    email: user.email,
    pin: '',
    avatarColor: user.avatarColor,
    status: user.status as 'active' | 'inactive',
    permissions: user.permissions as unknown as StaffUser['permissions'],
    createdAt: user.createdAt.toISOString().slice(0, 10),
    lastLoginAt: user.lastLoginAt
      ? user.lastLoginAt.toISOString().replace('T', ' ').slice(0, 16)
      : undefined,
  };
}
