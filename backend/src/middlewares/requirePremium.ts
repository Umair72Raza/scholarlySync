import { Request, Response, NextFunction } from 'express';

export const requirePremium = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.is_premium) {
    res.status(403).json({
      success: false,
      message: 'This feature requires a Premium subscription. Upgrade to unlock AI-powered study tools.',
      code: 'PREMIUM_REQUIRED',
    });
    return;
  }
  next();
};
