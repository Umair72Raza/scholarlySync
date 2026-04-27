import { Response } from 'express';
import { SubmissionStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { SubmissionModel } from '../models/submission.model';
import { submissionQueue } from '../queues/submission.queue';
import { notificationQueue } from '../queues/notification.queue';
import { broadcast } from '../websocket/wsServer';
import { WS_EVENTS } from '../websocket/wsEvents';
import { AppError, catchAsync } from '../middlewares/errorHandler';

export class SubmissionController {
  static submit = catchAsync(async (req: any, res: Response) => {
    const { assignmentId } = req.body;
    const userId = req.user?.sub;
    const file = req.file;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!file) throw new AppError('No file uploaded', 400);

    // 1. Verify Enrollment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: { include: { students: true } } }
    });

    const isEnrolled = assignment?.course.students.some(s => s.id === userId);
    if (!isEnrolled) throw new AppError('You are not enrolled in this course', 403);

    // 2. Check for existing submission (for resubmission)
    const existing = await prisma.submission.findFirst({
      where: { userId, assignmentId }
    });

    let submission;
    if (existing) {
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileUrl: `/uploads/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
          status: 'QUEUED',
          updatedAt: new Date()
        }
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          userId,
          assignmentId,
          fileUrl: `/uploads/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
          status: 'QUEUED'
        }
      });
    }

    res.json({
      success: true,
      message: existing ? 'Assignment resubmitted successfully' : 'Assignment submitted successfully',
      data: submission
    });

    // 4. Push to background queue for verification & AI tasks
    await submissionQueue.add(`submit-${submission.id}`, {
      submissionId: submission.id,
      userId,
      assignmentId,
      fileUrl: submission.fileUrl,
      fileName: submission.fileName,
      fileSize: submission.fileSize
    });

    // 5. Notify teacher in real-time via WebSocket
    const teacherId = assignment?.course.teacherId;
    if (teacherId) {
      broadcast(teacherId, {
        event: WS_EVENTS.NEW_SUBMISSION || 'NEW_SUBMISSION',
        payload: {
          submissionId: submission.id,
          assignmentTitle: assignment?.title,
          studentName: req.user?.name || 'A student'
        }
      });
    }
  });

  static grade = catchAsync(async (req: any, res: Response) => {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.user?.sub;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: { include: { course: true } } }
    });

    if (!submission) throw new AppError('Submission not found', 404);
    if (submission.assignment.course.teacherId !== teacherId) {
      throw new AppError('Only the course instructor can grade this submission', 403);
    }

    const numericGrade = Math.round(Number(grade));
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      throw new AppError('Grade must be a number between 0 and 100', 400);
    }

    const updated = await SubmissionModel.grade(id, numericGrade, feedback);

    // ─── Post-grading: Notifications ──────────────────────────
    const studentId = submission.userId;
    const assignmentTitle = submission.assignment.title;

    // 1. Notify via WebSocket (Real-time)
    broadcast(studentId, {
      event: WS_EVENTS.SUBMISSION_GRADED || 'SUBMISSION_GRADED',
      payload: { 
        submissionId: id,
        grade: numericGrade,
        assignmentTitle
      }
    });

    // 2. Queue persistent notification
    await notificationQueue.add(`grade-${id}`, {
      userId: studentId,
      message: `Your submission for "${assignmentTitle}" has been graded: ${numericGrade}%`,
      type: 'SUBMISSION_GRADED',
      assignmentId: submission.assignmentId
    });

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: updated
    });
  });

  static getByAssignment = catchAsync(async (req: any, res: Response) => {
    const { assignmentId } = req.params;
    const userId = req.user?.sub;

    const submissions = await prisma.submission.findMany({
      where: { 
        assignmentId,
        ...(req.user.role === 'STUDENT' ? { userId } : {})
      },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: submissions
    });
  });

  static getById = catchAsync(async (req: any, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.sub;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { 
        assignment: { 
          include: { 
            course: true 
          } 
        },
        user: { select: { name: true, email: true } }
      }
    });

    if (!submission) throw new AppError('Submission not found', 404);
    
    // Authorization: Student can only see their own, Teacher/Admin can see any in their course
    if (req.user.role === 'STUDENT' && submission.userId !== userId) {
      throw new AppError('Forbidden', 403);
    }

    res.json({ success: true, data: submission });
  });

  static getMySubmissions = catchAsync(async (req: any, res: Response) => {
    const userId = req.user?.sub;
    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: { 
        assignment: { 
          include: { 
            course: { select: { name: true, code: true } } 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: submissions });
  });

  static getTeacherDashboard = catchAsync(async (req: any, res: Response) => {
    const teacherId = req.user?.sub;

    // Get all submissions for courses taught by this teacher
    const submissions = await prisma.submission.findMany({
      where: {
        assignment: {
          course: { teacherId }
        }
      },
      include: {
        user: { select: { name: true, email: true } },
        assignment: { 
          select: { 
            title: true, 
            course: { select: { name: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { submissions } });
  });
}
