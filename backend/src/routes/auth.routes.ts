import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.post('/refresh',  AuthController.refresh);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me',      authenticate, AuthController.me);

export default router;
