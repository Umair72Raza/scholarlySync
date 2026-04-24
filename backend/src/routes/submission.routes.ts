import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

// Student: Submit assignment
router.post('/', upload.single('file'), SubmissionController.submit);

// General: Get submissions for an assignment
router.get('/assignment/:assignmentId', SubmissionController.getByAssignment);

// Teacher: Grade a submission
router.patch('/:id/grade', requireRole('TEACHER'), SubmissionController.grade);

export default router;
