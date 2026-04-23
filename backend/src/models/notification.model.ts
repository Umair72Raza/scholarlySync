import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export const NotificationModel = {
  findByUser: (userId: string, limit = 50) =>
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),

  create: (data: Prisma.NotificationCreateInput) =>
    prisma.notification.create({ data }),

  markRead: (id: string, userId: string) =>
    prisma.notification.update({
      where: { id, userId }, // userId ensures ownership
      data: { read: true },
    }),

  markAllRead: (userId: string) =>
    prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    }),

  countUnread: (userId: string) =>
    prisma.notification.count({ where: { userId, read: false } }),
};
