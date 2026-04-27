import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError, catchAsync } from '../middlewares/errorHandler';

export const CourseController = {
  // Get all courses (for discovery)
  getAll: catchAsync(async (req: Request, res: Response) => {
    const courses = await (prisma.course as any).findMany({
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { assignments: true, materials: true } }
      }
    });
    res.json({ success: true, data: courses });
  }),

  // Get teacher's own courses
  getMyCourses: catchAsync(async (req: Request, res: Response) => {
    const courses = await (prisma.course as any).findMany({
      where: { teacherId: req.user!.sub },
      include: {
        _count: { select: { assignments: true, materials: true } }
      }
    });
    res.json({ success: true, data: courses });
  }),

  // Get specific course
  getById: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const course = await (prisma.course as any).findUnique({
      where: { id: req.params.id as string },
      include: {
        teacher: { select: { id: true, name: true } },
        assignments: {
          include: {
            submissions: {
              where: { userId }, // Only show the current user's submissions
              select: { status: true, grade: true, feedback: true, createdAt: true }
            }
          }
        },
        materials: true
      }
    });
    if (!course) throw new AppError('Course not found', 404);
    res.json({ success: true, data: course });
  }),

  // Create new course (Teacher/Admin)
  create: catchAsync(async (req: Request, res: Response) => {
    const { name, code } = req.body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Course name is required and must be a string', 400);
    }
    if (!code || typeof code !== 'string' || !code.trim()) {
      throw new AppError('Course code is required and must be a string', 400);
    }

    const course = await (prisma.course as any).create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        teacherId: req.user!.sub
      }
    });
    
    res.status(201).json({ success: true, data: course });
  }),

  // Update course
  update: catchAsync(async (req: Request, res: Response) => {
    const { name, code } = req.body;
    const courseId = req.params.id as string;

    const existing = await (prisma.course as any).findUnique({ where: { id: courseId } });
    if (!existing) throw new AppError('Course not found', 404);
    if (existing.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized to update this course', 403);
    }

    const updated = await (prisma.course as any).update({
      where: { id: courseId },
      data: { 
        name: typeof name === 'string' ? name.trim() : undefined, 
        code: typeof code === 'string' ? code.trim().toUpperCase() : undefined 
      }
    });
    res.json({ success: true, data: updated });
  }),

  // Delete course
  delete: catchAsync(async (req: Request, res: Response) => {
    const courseId = req.params.id as string;
    const existing = await (prisma.course as any).findUnique({ where: { id: courseId } });
    if (!existing) throw new AppError('Course not found', 404);
    if (existing.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized to delete this course', 403);
    }

    await (prisma.course as any).delete({ where: { id: courseId } });
    res.json({ success: true, message: 'Course deleted successfully' });
  }),

  enroll: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    const course = await (prisma.course as any).findUnique({ 
      where: { id: id as string },
      include: { students: { where: { id: userId } } }
    });

    if (!course) throw new AppError('Course not found', 404);
    if (course.students.length > 0) throw new AppError('Already enrolled in this course', 400);

    await (prisma.course as any).update({
      where: { id: id as string },
      data: { students: { connect: { id: userId } } }
    });

    res.json({ success: true, message: 'Enrolled successfully' });
  }),

  getEnrolled: catchAsync(async (req: Request, res: Response) => {
    const courses = await (prisma.course as any).findMany({
      where: { students: { some: { id: req.user!.sub } } },
      include: { 
        teacher: { select: { id: true, name: true } },
        _count: { select: { assignments: true, materials: true } }
      }
    });
    res.json({ success: true, data: { courses } });
  }),

  getAvailable: catchAsync(async (req: Request, res: Response) => {
    const courses = await (prisma.course as any).findMany({
      where: { 
        NOT: { students: { some: { id: req.user!.sub } } }
      },
      include: { 
        teacher: { select: { id: true, name: true } },
        _count: { select: { assignments: true, materials: true } }
      }
    });
    res.json({ success: true, data: { courses } });
  }),

  unenroll: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    await (prisma.course as any).update({
      where: { id: id as string },
      data: { students: { disconnect: { id: userId } } }
    });

    res.json({ success: true, message: 'Unenrolled successfully' });
  })
};
