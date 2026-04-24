import { Router } from 'express';
import authRoutes         from './auth.routes';
import courseRoutes       from './course.routes';
import assignmentRoutes   from './assignment.routes';
import materialRoutes     from './material.routes';
import notificationRoutes from './notification.routes';
import adminRoutes        from './admin.routes';
import submissionRoutes   from './submission.routes';
import aiRoutes           from './ai.routes';

export const apiRouter = Router();

apiRouter.use('/auth',          authRoutes);
apiRouter.use('/courses',       courseRoutes);
apiRouter.use('/assignments',   assignmentRoutes);
apiRouter.use('/materials',     materialRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin',         adminRoutes);
apiRouter.use('/submissions',   submissionRoutes);
apiRouter.use('/ai',            aiRoutes);
