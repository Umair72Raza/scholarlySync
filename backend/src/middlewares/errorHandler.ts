import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

// ─── Custom Application Error ─────────────────────────
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Global Error Handler Middleware ──────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Application-level errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    res.status(400).json({ success: false, message: err.message, code: 'UPLOAD_ERROR' });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'A record with this value already exists.', code: 'DUPLICATE' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found.', code: 'NOT_FOUND' });
      return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data provided.', code: 'VALIDATION_ERROR' });
    return;
  }

  // Fallback 500
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    ...(env.NODE_ENV === 'development' && { debug: err.message, stack: err.stack }),
  });
};
