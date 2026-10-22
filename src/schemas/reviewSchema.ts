import { z } from 'zod';
import { idParamSchema } from './stallSchema.ts';

const optionalNullableText = (maxLength: number) =>
  z.string().trim().max(maxLength, `Maksimal ${maxLength} karakter`).optional();

export const createStallReviewParamsSchema = idParamSchema;

export const createStallReviewBodySchema = z
  .object({
    rating: z.number().int('rating harus berupa bilangan bulat').min(1).max(5),
    comment: optionalNullableText(1000),
  })
  .strict();

export type CreateStallReviewBody = z.infer<typeof createStallReviewBodySchema>;
