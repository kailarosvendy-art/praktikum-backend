import type { Request, Response } from 'express';
import type { CreateLikeInput } from '../repositories/likeRepository.ts';
import { LikeService } from '../services/likeService.ts';
import { getAuthenticatedUser } from '../middlewares/authenticate.ts';
import type { AuthUser } from '../services/tokenService.ts';

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isCreateLikeInput = (body: unknown): body is CreateLikeInput => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = body as Record<string, unknown>;
  return (
    Object.keys(input).every((key) => key === 'reviewId') &&
    isPositiveInteger(input.reviewId) &&
    !('userId' in input)
  );
};

export class LikeController {
  private likeService: LikeService;

  constructor(likeService: LikeService = new LikeService()) {
    this.likeService = likeService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'LIKE_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data like tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data review tidak ditemukan' });
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
      return res.status(409).json({ status: 'fail', message: 'Pengguna sudah menyukai review ini' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  createLike = async (req: Request, res: Response): Promise<Response> => {
    if (!isCreateLikeInput(req.body)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Body harus berisi reviewId berupa bilangan bulat positif; userId diambil dari token',
      });
    }
    try {
      const user = getAuthenticatedUser<AuthUser>(res);
      const like = await this.likeService.createLike({
        reviewId: req.body.reviewId,
        userId: user.id,
      });
      return res.status(201).json({ status: 'success', data: like });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteLike = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!isPositiveInteger(id)) {
      return res.status(400).json({ status: 'fail', message: 'id harus berupa bilangan bulat positif' });
    }
    try {
      const like = await this.likeService.deleteLike(id);
      return res.status(200).json({ status: 'success', data: like });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}