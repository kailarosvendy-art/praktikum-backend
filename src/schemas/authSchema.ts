import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('email harus berupa alamat email yang valid')
      .max(150, 'email maksimal 150 karakter'),
    password: z
      .string()
      .min(8, 'password minimal 8 karakter')
      .max(72, 'password maksimal 72 karakter')
      .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'password maksimal 72 byte'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('email harus berupa alamat email yang valid')
      .max(150, 'email maksimal 150 karakter'),
    password: z
      .string()
      .min(1, 'password wajib diisi')
      .max(72, 'password maksimal 72 karakter')
      .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'password maksimal 72 byte'),
  })
  .strict();

export const authMeSchema = z.object({}).strict().default({});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
