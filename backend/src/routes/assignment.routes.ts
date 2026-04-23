import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { SubmissionController } from '../controllers/submission.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { upload } from '../middlewares/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Assignments ──────────────────────────────────────────────────
router.get('/',                         AssignmentController.getAll);
router.get('/upcoming',                 AssignmentController.getUpcoming);
router.get('/course/:courseId',         AssignmentController.getByCourse);
router.get('/:id',                      AssignmentController.getById);

// Teacher / Admin only
router.post('/',     requireRole('TEACHER', 'ADMIN'), AssignmentController.create);
router.put('/:id',   requireRole('TEACHER', 'ADMIN'), AssignmentController.update);
router.delete('/:id',requireRole('TEACHER', 'ADMIN'), AssignmentController.delete);

// ─── Submission (Student) ─────────────────────────────────────────
// POST /assignments/:id/submit — single file upload, returns 202
router.post(
  '/:id/submit',
  requireRole('STUDENT'),
  upload.single('file'),
  AssignmentController.submit,
);

// ─── Submission read routes ───────────────────────────────────────
router.get('/submissions/mine',             SubmissionController.getMySubmissions);
router.get('/submissions/:id',              SubmissionController.getById);
router.get('/:assignmentId/submissions',
  requireRole('TEACHER', 'ADMIN'),
  SubmissionController.getByAssignment,
);

export default router;
