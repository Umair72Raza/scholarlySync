import prisma from '../config/prisma';
import { Prisma, SubmissionStatus } from '@prisma/client';

export const SubmissionModel = {
  findById: (id: string) =>
    prisma.submission.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignment: { include: { course: true } },
      },
    }),

  findByUser: (userId: string) =>
    prisma.submission.findMany({
      where: { userId },
      include: { assignment: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    }),

  findByAssignment: (assignmentId: string) =>
    prisma.submission.findMany({
      where: { assignmentId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),

  create: (data: Prisma.SubmissionCreateInput) =>
    prisma.submission.create({ data }),

  updateStatus: (id: string, status: SubmissionStatus, errorMessage?: string) =>
    prisma.submission.update({
      where: { id },
      data: { status, ...(errorMessage !== undefined && { errorMessage }) },
    }),

  countByStatus: (assignmentId: string) =>
    prisma.submission.groupBy({
      by: ['status'],
      where: { assignmentId },
      _count: { status: true },
    }),

  grade: (id: string, grade: number, feedback?: string) =>
    prisma.submission.update({
      where: { id },
      data: { 
        grade, 
        feedback,
        status: SubmissionStatus.GRADED
      }
    }),

  findForTeacher: (teacherId: string) =>
    prisma.submission.findMany({
      where: {
        assignment: {
          course: { teacherId }
        }
      },
      include: {
        user: { select: { id: true, name: true } },
        assignment: { select: { id: true, title: true, course: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    })
};
