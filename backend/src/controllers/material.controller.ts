import { Request, Response, NextFunction } from 'express';
import { MaterialModel } from '../models/material.model';
import prisma from '../config/prisma';
import { getFileUrl } from '../services/file.service';
import { AppError } from '../middlewares/errorHandler';
import { broadcastAll } from '../websocket/wsServer';
import { WS_EVENTS } from '../websocket/wsEvents';

export const MaterialController = {

  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = req.query.courseId as string | undefined;
      const materials = courseId
        ? await MaterialModel.findByCourse(courseId)
        : await MaterialModel.findAll();
      res.json({ success: true, data: { materials } });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const material = await MaterialModel.findById(req.params.id as string);
      if (!material) throw new AppError('Material not found', 404);
      res.json({ success: true, data: { material } });
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, courseId } = req.body;
      if (!title || !courseId) {
        throw new AppError('title and courseId are required', 400);
      }

      // Verify course ownership
      const course = await (prisma.course as any).findUnique({ where: { id: courseId as string } });
      if (!course) throw new AppError('Course not found', 404);
      if (course.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
        throw new AppError('You can only add materials to your own courses', 403);
      }

      const fileUrl = req.file ? getFileUrl(req.file.filename) : undefined;
      const fileName = req.file ? req.file.originalname : undefined;

      const material = await MaterialModel.create({
        title,
        content: content || 'No summary provided.',
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        course: { connect: { id: courseId as string } },
      });

      // Notify connected students that new material is available
      broadcastAll({ event: WS_EVENTS.NEW_MATERIAL, payload: { materialId: material.id, title, courseId } });

      res.status(201).json({ success: true, message: 'Material created', data: { material } });
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content } = req.body;
      const materialId = req.params.id as string;

      // Verify ownership
      const existing = await MaterialModel.findById(materialId);
      if (!existing) throw new AppError('Material not found', 404);
      
      const course = await (prisma.course as any).findUnique({ where: { id: existing.courseId } });
      if (course.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized to update this material', 403);
      }

      const material = await MaterialModel.update(materialId, {
        ...(title && { title }),
        ...(content && { content }),
      });
      res.json({ success: true, message: 'Material updated', data: { material } });
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const materialId = req.params.id as string;
      const existing = await MaterialModel.findById(materialId);
      if (!existing) throw new AppError('Material not found', 404);

      const course = await (prisma.course as any).findUnique({ where: { id: existing.courseId } });
      if (course.teacherId !== req.user!.sub && req.user!.role !== 'ADMIN') {
        throw new AppError('Unauthorized to delete this material', 403);
      }

      await MaterialModel.delete(materialId);
      res.json({ success: true, message: 'Material deleted' });
    } catch (err) { next(err); }
  },
};
