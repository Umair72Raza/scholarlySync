import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { requirePremium } from '../middlewares/requirePremium';
import { upload } from '../middlewares/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Materials ────────────────────────────────────────────────────
router.get('/',    MaterialController.getAll);
router.get('/:id', MaterialController.getById);

// Teacher / Admin only — optional file attachment
router.post(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  upload.single('file'),
  MaterialController.create,
);
router.put(   '/:id', requireRole('TEACHER', 'ADMIN'), MaterialController.update);
router.delete('/:id', requireRole('TEACHER', 'ADMIN'), MaterialController.delete);

// ─── AI Study Assistant ───────────────────────────────────────────
// Premium-gated: authenticate → requirePremium → AI handler
router.post('/:id/ask', requirePremium, AIController.ask);

export default router;
