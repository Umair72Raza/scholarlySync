import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export const MaterialModel = {
  findById: (id: string) =>
    prisma.material.findUnique({ where: { id }, include: { course: true } }),

  findAll: () =>
    prisma.material.findMany({ include: { course: true }, orderBy: { createdAt: 'desc' } }),

  findByCourse: (courseId: string) =>
    prisma.material.findMany({
      where: { courseId },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    }),

  create: (data: Prisma.MaterialCreateInput) =>
    prisma.material.create({ data, include: { course: true } }),

  update: (id: string, data: Prisma.MaterialUpdateInput) =>
    prisma.material.update({ where: { id }, data, include: { course: true } }),

  delete: (id: string) =>
    prisma.material.delete({ where: { id } }),
};
