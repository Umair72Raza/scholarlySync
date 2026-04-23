import prisma from '../config/prisma';
import { Prisma, Role } from '@prisma/client';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  is_premium: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const UserModel = {
  /** Find by ID — returns public fields only (no password) */
  findById: (id: string) =>
    prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT }),

  /** Find by email — returns ALL fields including password (for auth) */
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  /** Create new user */
  create: (data: Prisma.UserCreateInput) =>
    prisma.user.create({ data }),

  /** Update user fields */
  update: (id: string, data: Prisma.UserUpdateInput) =>
    prisma.user.update({ where: { id }, data, select: PUBLIC_SELECT }),

  /** List all users — with optional role filter */
  findAll: (role?: Role) =>
    prisma.user.findMany({
      where: role ? { role } : undefined,
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    }),

  /** Toggle premium status */
  setPremium: (id: string, is_premium: boolean) =>
    prisma.user.update({ where: { id }, data: { is_premium }, select: PUBLIC_SELECT }),
};
