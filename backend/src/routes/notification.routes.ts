import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/',              NotificationController.getMyNotifications);
router.put('/read-all',      NotificationController.markAllRead);
router.put('/:id/read',      NotificationController.markRead);

export default router;
