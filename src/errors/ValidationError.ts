import { AppError } from './AppError.ts';

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  constructor(
    readonly errors: ValidationIssue[],
  ) {
    super(400, 'Validasi gagal');
    this.name = 'ValidationError';
  }
}
