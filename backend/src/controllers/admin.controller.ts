import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { submissionQueue, notificationQueue, broadcastQueue } from '../queues';
import { getConnectedClientCount } from '../websocket/wsServer';
import { AppError } from '../middlewares/errorHandler';

export const AdminController = {

  /**
   * GET /api/admin/queue-stats
   * Returns real-time BullMQ queue health for the system load monitor
   */
  getQueueStats: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        submissionCounts,
        notificationCounts,
        broadcastCounts,
      ] = await Promise.all([
        submissionQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        notificationQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        broadcastQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      ]);

      res.json({
        success: true,
        data: {
          websocketClients: getConnectedClientCount(),
          queues: {
            submission:   submissionCounts,
            notification: notificationCounts,
            broadcast:    broadcastCounts,
          },
        },
      });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/admin/broadcast
   * Enqueues a bulk alert to all students in a course
   */
  broadcastToCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId, message } = req.body;
      if (!courseId || !message?.trim()) {
        throw new AppError('courseId and message are required', 400);
      }

      await broadcastQueue.add(`broadcast-${Date.now()}`, {
        courseId,
        message: message.trim(),
        sentBy: req.user!.sub,
      });

      res.status(202).json({
        success: true,
        message: 'Broadcast queued successfully',
        data: { courseId },
      });
    } catch (err) { next(err); }
  },

  /**
   * GET /api/admin/users
   * List all users (with optional ?role= filter)
   */
  getUsers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.query as { role?: string };
      const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
      if (role && !validRoles.includes(role)) {
        throw new AppError(`Invalid role filter. Use: ${validRoles.join(', ')}`, 400);
      }

      const users = await UserModel.findAll(role as 'STUDENT' | 'TEACHER' | 'ADMIN' | undefined);
      res.json({ success: true, data: { users, count: users.length } });
    } catch (err) { next(err); }
  },

  /**
   * PATCH /api/admin/users/:id/premium
   * Toggle premium status for a user
   */
  togglePremium: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { is_premium } = req.body;
      if (typeof is_premium !== 'boolean') {
        throw new AppError('is_premium must be a boolean', 400);
      }
      const user = await UserModel.setPremium(req.params.id, is_premium);
      res.json({
        success: true,
        message: `User ${is_premium ? 'upgraded to' : 'downgraded from'} Premium`,
        data: { user },
      });
    } catch (err) { next(err); }
  },
};
