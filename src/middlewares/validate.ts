import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError, type ValidationIssue } from '../errors/ValidationError.ts';

export type RequestSource = 'body' | 'query' | 'params';

export function validate(schema: ZodType, source: RequestSource): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors: ValidationIssue[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new ValidationError(errors));
    }

    const validated = (res.locals.validated ?? {}) as Partial<Record<RequestSource, unknown>>;
    validated[source] = result.data;
    res.locals.validated = validated;
    return next();
  };
}

export function getValidated<T>(res: Response, source: RequestSource): T {
  const validated = res.locals.validated as Partial<Record<RequestSource, unknown>> | undefined;
  if (!validated || !(source in validated)) {
    throw new Error(`Data request ${source} belum divalidasi`);
  }
  return validated[source] as T;
}
