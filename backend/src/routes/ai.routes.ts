import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// All AI routes are protected by authentication
router.use(authenticate);

router.post('/ask', AIController.ask);
router.post('/summarize', AIController.summarize);

export default router;
