import type { NextFunction, Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';
import { getValidated } from '../middlewares/validate.ts';
import { getAuthenticatedUser } from '../middlewares/authenticate.ts';
import type { AuthUser } from '../services/tokenService.ts';
import { AppError } from '../errors/AppError.ts';
import type {
  CreateStallInput,
  IdParam,
  StallQuery,
  UpdateStallInput,
} from '../schemas/stallSchema.ts';

type StallOperations = Pick<
  StallService,
  'getAllStalls' | 'getStallById' | 'getStallMenus' | 'createStall' | 'updateStall' | 'deleteStall'
>;

export class StallController {
  constructor(private readonly stallService: StallOperations = new StallService()) {}

  private handleError(next: NextFunction, error: unknown): void {
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      next(new AppError(404, 'Data warung tidak ditemukan'));
      return;
    }
    next(error);
  }

  getStalls = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, category } = getValidated<StallQuery>(res, 'query');

      const { data, total } = await this.stallService.getAllStalls({
        search,
        category,
        page,
        limit,
      });

      res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      this.handleError(next, error);
    }
  };

  getStallById = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getValidated<IdParam>(res, 'params');
      const stall = await this.stallService.getStallById(id);
      res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      this.handleError(next, error);
    }
  };

  getStallMenus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getValidated<IdParam>(res, 'params');
      const menus = await this.stallService.getStallMenus(id);
      res.status(200).json({ status: 'success', data: menus });
    } catch (error) {
      this.handleError(next, error);
    }
  };

  createStall = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = getValidated<CreateStallInput>(res, 'body');
      const user = getAuthenticatedUser<AuthUser>(res);
      const stall = await this.stallService.createStall({ ...input, ownerId: user.id });
      res.status(201).json({ status: 'success', data: stall });
    } catch (error) {
      this.handleError(next, error);
    }
  };

  updateStall = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getValidated<IdParam>(res, 'params');
      const input = getValidated<UpdateStallInput>(res, 'body');
      const user = getAuthenticatedUser<AuthUser>(res);
      const stall = await this.stallService.updateStall(id, input, user);
      res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      this.handleError(next, error);
    }
  };

  deleteStall = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getValidated<IdParam>(res, 'params');
      const stall = await this.stallService.deleteStall(id);
      res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      this.handleError(next, error);
    }
  };
}
