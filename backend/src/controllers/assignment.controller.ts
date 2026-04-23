import { Request, Response, NextFunction } from 'express';
import { AssignmentModel } from '../models/assignment.model';
import prisma from '../config/prisma';
import { SubmissionModel } from '../models/submission.model';
import { submissionQueue } from '../queues/submission.queue';
import { getFileUrl } from '../services/file.service';
import { scheduleAssignmentReminders } from '../services/notification.service';
import { broadcast } from '../websocket/wsServer';
import { WS_EVENTS } from '../websocket/wsEvents';
import { AppError } from '../middlewares/errorHandler';

export const AssignmentController = {

  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await AssignmentModel.findAll();
      res.json({ success: true, data: { assignments } });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await AssignmentModel.findById(req.params.id as string);
      if (!assignment) throw new AppError('Assignment not found', 404);
      res.json({ success: true, data: { assignment } });
    } catch (err) { next(err); }
  },

  getByCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await AssignmentModel.findByCourse(req.params.courseId as string);
      res.json({ success: true, data: { assignments } });
    } catch (err) { next(err); }
  },

  getUpcoming: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await AssignmentModel.findUpcoming(7);
      res.json({ success: true, data: { assignments } });
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, deadline, courseId } = req.body;
      if (!title || !deadline || !courseId) {
        throw new AppError('title, deadline, and courseId are required', 400);
      }

      // Verify course ownership
      const course = await (prisma.course as any).findUnique({ where: { id: courseId } });
      if (!course) throw new AppError('Course not found', 404);
      if (course.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
        throw new AppError('You can only create assignments for your own courses', 403);
      }

      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) throw new AppError('Invalid deadline date', 400);
      if (deadlineDate <= new Date()) throw new AppError('Deadline must be in the future', 400);

      const assignment = await AssignmentModel.create({
        title,
        description,
        deadline: deadlineDate,
        course: { connect: { id: courseId } },
      });

      res.status(201).json({ success: true, message: 'Assignment created', data: { assignment } });
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, deadline } = req.body;
      const assignmentId = req.params.id as string;

      // Verify ownership via course
      const existing = await AssignmentModel.findById(assignmentId);
      if (!existing) throw new AppError('Assignment not found', 404);
      
      const course = await (prisma.course as any).findUnique({ where: { id: existing.courseId } });
      if (course.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized to update this assignment', 403);
      }

      const assignment = await AssignmentModel.update(assignmentId, {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(deadline && { deadline: new Date(deadline) }),
      });
      res.json({ success: true, message: 'Assignment updated', data: { assignment } });
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignmentId = req.params.id as string;
      const existing = await AssignmentModel.findById(assignmentId);
      if (!existing) throw new AppError('Assignment not found', 404);

      const course = await (prisma.course as any).findUnique({ where: { id: existing.courseId } });
      if (course.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized to delete this assignment', 403);
      }

      await AssignmentModel.delete(assignmentId);
      res.json({ success: true, message: 'Assignment deleted' });
    } catch (err) { next(err); }
  },

  /**
   * POST /assignments/:id/submit
   * Receives file metadata + uploaded file → pushes to BullMQ → returns 202
   */
  submit: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const assignmentId = req.params.id as string;
      const file = req.file;

      if (!file) throw new AppError('No file uploaded', 400);

      const assignment = await AssignmentModel.findById(assignmentId);
      if (!assignment) throw new AppError('Assignment not found', 404);
      if (new Date() > assignment.deadline) throw new AppError('Submission deadline has passed', 422);

      const fileUrl = getFileUrl(file.filename);

      // Persist submission record immediately
      const submission = await SubmissionModel.create({
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        user:       { connect: { id: userId } },
        assignment: { connect: { id: assignmentId } },
      });

      // Push to BullMQ — worker handles validation and status updates
      await submissionQueue.add(`submit-${submission.id}`, {
        submissionId: submission.id,
        userId,
        assignmentId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
      });

      // Immediate WS event: just queued
      broadcast(userId, {
        event: WS_EVENTS.SUBMISSION_QUEUED,
        payload: { submissionId: submission.id, fileName: file.originalname },
      });

      // Schedule reminders for the student
      await scheduleAssignmentReminders(userId, assignmentId, assignment.title, assignment.deadline);

      res.status(202).json({
        success: true,
        message: 'Submission received and queued for processing',
        data: { submissionId: submission.id, status: 'QUEUED' },
      });
    } catch (err) { next(err); }
  },
};
