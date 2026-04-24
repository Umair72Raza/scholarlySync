import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

// All course routes require authentication
router.use(authenticate);

router.get('/',               CourseController.getAll);
router.get('/mine',           CourseController.getMyCourses); // Teacher's courses
router.get('/enrolled',       requireRole('STUDENT'), CourseController.getEnrolled);
router.get('/available',      requireRole('STUDENT'), CourseController.getAvailable);
router.get('/:id',            CourseController.getById);

// Student actions
router.post('/:id/enroll',    requireRole('STUDENT'), CourseController.enroll);
router.delete('/:id/enroll',  requireRole('STUDENT'), CourseController.unenroll);

// Teacher/Admin only actions
router.post('/',              requireRole('TEACHER', 'ADMIN'), CourseController.create);
router.put('/:id',            requireRole('TEACHER', 'ADMIN'), CourseController.update);
router.delete('/:id',         requireRole('TEACHER', 'ADMIN'), CourseController.delete);

export default router;
