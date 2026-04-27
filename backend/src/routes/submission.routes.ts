import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

// Student: Submit assignment
router.post('/', upload.single('file'), SubmissionController.submit);

// Teacher: Get dashboard (all submissions for teacher's courses)
router.get('/teacher', requireRole('TEACHER', 'ADMIN'), SubmissionController.getTeacherDashboard);

// Student: Get my own submissions
router.get('/mine', SubmissionController.getMySubmissions);

// General: Get submissions for an assignment
router.get('/assignment/:assignmentId', SubmissionController.getByAssignment);

// Student/Teacher: Get by ID
router.get('/:id', SubmissionController.getById);

// Teacher: Grade a submission
router.patch('/:id/grade', requireRole('TEACHER', 'ADMIN'), SubmissionController.grade);

export default router;
