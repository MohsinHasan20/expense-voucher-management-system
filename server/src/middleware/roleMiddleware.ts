import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';

export function authorizeRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of [${roles.join(', ')}] role.`,
      });
    }

    next();
  };
}
