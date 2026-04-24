import { Response } from 'express';
import prisma from '../config/prisma';
import { AIService } from '../services/ai.service';
import { AppError, catchAsync } from '../middlewares/errorHandler';

export class AIController {
  static ask = catchAsync(async (req: any, res: Response) => {
    const { materialId, question, history } = req.body;
    const userId = req.user?.sub;

    if (!userId) throw new AppError('Unauthorized', 401);

    // 1. Verify Premium Status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_premium: true }
    });

    if (!user?.is_premium) {
      throw new AppError('Premium subscription required for AI features', 403);
    }

    // 2. Get Material Content
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { content: true }
    });

    if (!material?.content) {
      throw new AppError('Material content is empty or not yet processed.', 404);
    }

    // 3. Call AI Service
    const answer = await AIService.askQuestion(material.content, question, history);

    res.json({
      success: true,
      data: answer
    });
  });

  static summarize = catchAsync(async (req: any, res: Response) => {
    const { materialId } = req.body;
    const userId = req.user?.sub;

    if (!userId) throw new AppError('Unauthorized', 401);

    // 1. Verify Premium Status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_premium: true }
    });

    if (!user?.is_premium) {
      throw new AppError('Premium subscription required for AI Summaries', 403);
    }

    // 2. Get Material Content
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { content: true }
    });

    if (!material?.content) {
      throw new AppError('Material content is empty or not yet processed.', 404);
    }

    // 3. Generate Summary
    const summary = await AIService.getSummary(material.content);

    res.json({
      success: true,
      data: { summary }
    });
  });
}
