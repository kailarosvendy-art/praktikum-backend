import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.ts';
import { verifyToken } from '../services/tokenService.ts';

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return next(new AppError(401, 'Token autentikasi diperlukan'));
  }

  try {
    res.locals.authUser = verifyToken(match[1]);
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.NotBeforeError) {
      return next(new AppError(401, 'Token tidak valid atau sudah kedaluwarsa'));
    }
    return next(error);
  }
};

export function getAuthenticatedUser<T>(res: import('express').Response): T {
  const user: unknown = res.locals.authUser;
  if (!user) throw new Error('Data autentikasi tidak tersedia');
  return user as T;
}
