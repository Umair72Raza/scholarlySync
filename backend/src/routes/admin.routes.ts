import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

// All admin routes: must be logged in AND have ADMIN or TEACHER role
router.use(authenticate);
router.use(requireRole('ADMIN', 'TEACHER'));

// ─── System Monitoring ────────────────────────────────────────────
router.get('/queue-stats',  AdminController.getQueueStats);

// ─── User Management (ADMIN only) ────────────────────────────────
router.get('/users',
  requireRole('ADMIN'),
  AdminController.getUsers,
);
router.patch('/users/:id/premium',
  requireRole('ADMIN'),
  AdminController.togglePremium,
);

// ─── Bulk Broadcast ───────────────────────────────────────────────
router.post('/broadcast', AdminController.broadcastToCourse);

export default router;
