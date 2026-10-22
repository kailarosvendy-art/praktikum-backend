import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';
import { ValidationError } from '../errors/ValidationError.ts';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
      errors: error instanceof ValidationError ? error.errors : [],
    });
    return;
  }

  if (
    error &&
    typeof error === 'object' &&
    'number' in error &&
    (error.number === 2601 || error.number === 2627)
  ) {
    res.status(409).json({
      status: 'fail',
      message: 'Data bentrok dengan data yang sudah ada',
      errors: [],
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400 &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      status: 'fail',
      message: 'JSON pada body tidak valid',
      errors: [{ field: 'body', message: 'Body harus berisi JSON yang valid' }],
    });
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'fail',
    message: 'Terjadi kesalahan pada server',
    errors: [],
  });
};
