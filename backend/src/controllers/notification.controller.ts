import { Request, Response, NextFunction } from 'express';
import { NotificationModel } from '../models/notification.model';

export const NotificationController = {

  getMyNotifications: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notifications = await NotificationModel.findByUser(req.user!.sub);
      const unreadCount   = await NotificationModel.countUnread(req.user!.sub);
      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) { next(err); }
  },

  markRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await NotificationModel.markRead(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'Notification marked as read', data: { notification } });
    } catch (err) { next(err); }
  },

  markAllRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { count } = await NotificationModel.markAllRead(req.user!.sub);
      res.json({ success: true, message: `${count} notifications marked as read` });
    } catch (err) { next(err); }
  },
};
