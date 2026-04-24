import { Response } from 'express';
import prisma from '../config/prisma';
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

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        grade: Number(grade),
        feedback,
        status: 'GRADED'
      }
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

    res.json({ success: true, data: submissions });
  });
}
