import type { NextFunction, Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.ts';
import { getValidated } from '../middlewares/validate.ts';
import { getAuthenticatedUser } from '../middlewares/authenticate.ts';
import type { CreateStallReviewBody } from '../schemas/reviewSchema.ts';
import type { IdParam } from '../schemas/stallSchema.ts';
import type { AuthUser } from '../services/tokenService.ts';
import { AppError } from '../errors/AppError.ts';

type ReviewOperations = Pick<ReviewService, 'getAllReviews' | 'createReview' | 'deleteReview'>;
export class ReviewController {
  constructor(private readonly reviewService: ReviewOperations = new ReviewService()) {}

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data review tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data pengguna tidak ditemukan' });
    }
    if (
      error &&
      typeof error === 'object' &&
      'number' in error &&
      (error.number === 2601 || error.number === 2627)
    ) {
      return res.status(409).json({
        status: 'fail',
        message: 'Pengguna sudah memberikan review untuk warung ini',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getReviews = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const reviews = await this.reviewService.getAllReviews();
      return res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createStallReview = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = getValidated<IdParam>(res, 'params');
      const input = getValidated<CreateStallReviewBody>(res, 'body');
      const user = getAuthenticatedUser<AuthUser>(res);
      const review = await this.reviewService.createReview({
        stallId: id,
        userId: user.id,
        ...input,
      });
      res.status(201).json({ status: 'success', data: review });
    } catch (error) {
      if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
        next(new AppError(404, 'Data warung tidak ditemukan'));
        return;
      }
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        next(new AppError(401, 'Pengguna pada token tidak lagi tersedia'));
        return;
      }
      next(error);
    }
  };

  deleteReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = getValidated<IdParam>(res, 'params');
      const review = await this.reviewService.deleteReview(id);
      return res.status(200).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}