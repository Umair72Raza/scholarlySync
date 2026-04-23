import { Request, Response, NextFunction } from 'express';
import { MaterialModel } from '../models/material.model';
import { askClaude, streamClaude, checkAIRateLimit } from '../services/ai.service';
import { AppError } from '../middlewares/errorHandler';

export const AIController = {

  /**
   * POST /api/materials/:id/ask
   * Protected by: authenticate → requirePremium
   * Streams Claude's response as Server-Sent Events.
   */
  ask: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { question } = req.body;
      if (!question?.trim()) throw new AppError('A question is required', 400);

      const material = await MaterialModel.findById(req.params.id);
      if (!material) throw new AppError('Study material not found', 404);

      // Per-user AI rate limit (20 req/min via Redis)
      await checkAIRateLimit(req.user!.sub);

      const streaming = req.headers.accept?.includes('text/event-stream');

      if (streaming) {
        // ─── Streaming (SSE) mode ──────────────────────────
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        await streamClaude(
          material.title,
          material.content,
          question,
          (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
          ()      => { res.write('data: [DONE]\n\n'); res.end(); },
        );
      } else {
        // ─── Non-streaming (JSON) mode ────────────────────
        const answer = await askClaude(material.title, material.content, question);
        res.json({ success: true, data: { answer, materialId: material.id } });
      }
    } catch (err) { next(err); }
  },
};
