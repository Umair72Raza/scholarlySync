import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * Role-based access control middleware factory.
 * @example router.post('/', authenticate, requireRole('TEACHER', 'ADMIN'), handler)
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(' or ')}`,
        code: 'FORBIDDEN',
      });
      return;
    }
    next();
  };
};
