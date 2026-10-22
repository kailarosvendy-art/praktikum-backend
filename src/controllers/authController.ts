import type { NextFunction, Request, Response } from 'express';
import { getAuthenticatedUser } from '../middlewares/authenticate.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import { AuthService, type AuthUserDto } from '../services/authService.ts';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  register = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = getValidated<RegisterInput>(res, 'body');
      const user = await this.authService.register(input);
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  login = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = getValidated<LoginInput>(res, 'body');
      const result = await this.authService.login(input);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  me = (_req: Request, res: Response): void => {
    const user = getAuthenticatedUser<AuthUserDto>(res);
    res.status(200).json({ status: 'success', data: user });
  };
}
