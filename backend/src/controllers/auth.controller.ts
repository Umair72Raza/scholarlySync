import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { UserModel } from '../models/user.model';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { AppError } from '../middlewares/errorHandler';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

const REFRESH_PREFIX = 'refresh:';
const BCRYPT_ROUNDS = 12;

// ─── Token Helpers ────────────────────────────────────────
const signAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProd = env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const issueTokenPair = async (user: {
  id: string;
  email: string;
  role: Role;
  is_premium: boolean;
}): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    is_premium: user.is_premium,
  });
  const refreshToken = signRefreshToken(user.id);



  // Store refresh token in Redis with 7-day TTL
  await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { accessToken, refreshToken };
};

// ─── Controller ───────────────────────────────────────────
export const AuthController = {

  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, role = 'STUDENT' } = req.body;

      if (!name?.trim() || !email?.trim() || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }
      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }
      if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      const existing = await UserModel.findByEmail(email.toLowerCase());
      if (existing) throw new AppError('This email is already registered', 409);

      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await UserModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role as Role,
      });

      const tokens = await issueTokenPair(user);

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role, is_premium: user.is_premium }
        },
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const user = await UserModel.findByEmail(email.toLowerCase());
      if (!user) throw new AppError('Invalid credentials', 401);

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw new AppError('Invalid credentials', 401);

      const tokens = await issueTokenPair(user);

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role, is_premium: user.is_premium },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new AppError('Refresh token is required', 400);

      // Verify signature
      let decoded: { sub: string };
      try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
      } catch {
        throw new AppError('Invalid or expired refresh token', 401, 'REFRESH_INVALID');
      }

      // Verify it matches what we stored (rotation check)
      const stored = await redis.get(`${REFRESH_PREFIX}${decoded.sub}`);
      if (!stored || stored !== refreshToken) {
        throw new AppError('Refresh token has been revoked', 401, 'REFRESH_REVOKED');
      }

      // Fetch full user for token re-issue
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new AppError('User no longer exists', 404);

      // Rotate tokens (old refresh invalidated, new pair issued)
      const tokens = await issueTokenPair(user);

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.json({ success: true, message: 'Token refreshed successfully' });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.sub) {
        await redis.del(`${REFRESH_PREFIX}${req.user.sub}`);
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findById(req.user!.sub);
      if (!user) throw new AppError('User not found', 404);
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },
};
