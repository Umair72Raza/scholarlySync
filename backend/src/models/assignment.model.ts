import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

const WITH_COURSE = { course: true } satisfies Prisma.AssignmentInclude;

export const AssignmentModel = {
  findById: (id: string) =>
    prisma.assignment.findUnique({ where: { id }, include: WITH_COURSE }),

  findAll: () =>
    prisma.assignment.findMany({ include: WITH_COURSE, orderBy: { deadline: 'asc' } }),

  findByCourse: (courseId: string) =>
    prisma.assignment.findMany({ where: { courseId }, include: WITH_COURSE, orderBy: { deadline: 'asc' } }),

  findUpcoming: (daysAhead = 7) => {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return prisma.assignment.findMany({
      where: { deadline: { gte: now, lte: future } },
      include: WITH_COURSE,
      orderBy: { deadline: 'asc' },
    });
  },

  create: (data: Prisma.AssignmentCreateInput) =>
    prisma.assignment.create({ data, include: WITH_COURSE }),

  update: (id: string, data: Prisma.AssignmentUpdateInput) =>
    prisma.assignment.update({ where: { id }, data, include: WITH_COURSE }),

  delete: (id: string) =>
    prisma.assignment.delete({ where: { id } }),
};
