import { Request, Response, NextFunction } from 'express';
import { SubmissionModel } from '../models/submission.model';
import { AppError } from '../middlewares/errorHandler';

export const SubmissionController = {

  getMySubmissions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submissions = await SubmissionModel.findByUser(req.user!.sub);
      res.json({ success: true, data: { submissions } });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await SubmissionModel.findById(req.params.id);
      if (!submission) throw new AppError('Submission not found', 404);

      // Students can only view their own submissions
      if (req.user!.role === 'STUDENT' && submission.userId !== req.user!.sub) {
        throw new AppError('Access denied', 403);
      }

      res.json({ success: true, data: { submission } });
    } catch (err) { next(err); }
  },

  getByAssignment: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submissions = await SubmissionModel.findByAssignment(req.params.assignmentId);
      res.json({ success: true, data: { submissions } });
    } catch (err) { next(err); }
  },
};
