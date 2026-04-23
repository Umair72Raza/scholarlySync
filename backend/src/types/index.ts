import { Request } from 'express';
import { Role } from '@prisma/client';

// ─── JWT ──────────────────────────────────────────────
export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: Role;
  is_premium: boolean;
  iat?: number;
  exp?: number;
}

// ─── API Response shape ───────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ─── WebSocket message shape ──────────────────────────
export interface WsMessage {
  event: string;
  payload: unknown;
}

// ─── Augment Express Request ──────────────────────────
// Adds req.user everywhere once authenticate middleware runs
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
