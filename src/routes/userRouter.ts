import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';

const userRouter = Router();
const userController = new UserController();

userRouter.use(authenticate, authorizeRoles('admin'));

userRouter.get('/', (_req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.responses[200] = { description: 'Daftar pengguna (tanpa password hash)' }
  return userController.getUsers(_req, res);
});

userRouter.post('/', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/UserInput' } }
  // #swagger.responses[201] = { description: 'Pengguna berhasil dibuat' }
  return userController.createUser(req, res);
});

export { userRouter };