import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';
import type { UserRole } from '../repositories/userRepository.ts';
import { getAuthenticatedUser } from './authenticate.ts';

export function authorizeRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    const user = getAuthenticatedUser<{ role: UserRole }>(res);
    if (!allowedRoles.includes(user.role)) {
      return next(new AppError(403, 'Role Anda tidak memiliki akses ke endpoint ini'));
    }
    return next();
  };
}
