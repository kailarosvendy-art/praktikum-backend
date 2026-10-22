import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { validate } from '../middlewares/validate.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';
import { AuthService, type AuthRepository } from '../services/authService.ts';

export function createAuthRouter(repository?: AuthRepository): Router {
  const router = Router();
  const controller = new AuthController(repository ? new AuthService(repository) : new AuthService());

  router.post('/register', validate(registerSchema, 'body'), (req, res, next) => {
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/RegisterInput' } }
    // #swagger.responses[201] = { description: 'Akun berhasil dibuat tanpa mengembalikan password', schema: { $ref: '#/definitions/RegisterResponse' } }
    // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
    // #swagger.responses[409] = { description: 'Email sudah terdaftar' }
    // #swagger.responses[500] = { description: 'Kesalahan server atau konfigurasi JWT' }
    return controller.register(req, res, next);
  });

  router.post('/login', validate(loginSchema, 'body'), (req, res, next) => {
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/LoginInput' } }
    // #swagger.responses[200] = { description: 'Token JWT dan profil pengguna', schema: { $ref: '#/definitions/LoginResponse' } }
    // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
    // #swagger.responses[401] = { description: 'Email atau password salah' }
    // #swagger.responses[500] = { description: 'Kesalahan server atau konfigurasi JWT' }
    return controller.login(req, res, next);
  });

  router.get('/me', authenticate, (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = { description: 'Profil dari klaim JWT', schema: { $ref: '#/definitions/AuthMeResponse' } }
    // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
    // #swagger.responses[500] = { description: 'Kesalahan konfigurasi JWT' }
    return controller.me(req, res);
  });

  return router;
}

export const authRouter = createAuthRouter();
