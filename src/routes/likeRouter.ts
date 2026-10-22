import { Router } from 'express';
import { LikeController } from '../controllers/likeController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';

const likeRouter = Router();
const likeController = new LikeController();

likeRouter.use(authenticate, authorizeRoles('admin'));

likeRouter.post('/', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/LikeInput' } }
  // #swagger.responses[201] = { description: 'Like dibuat dengan userId dari token admin' }
  // #swagger.responses[409] = { description: 'User sudah menyukai review ini' }
  return likeController.createLike(req, res);
});

likeRouter.delete('/:id', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Like berhasil dihapus dan likeCount review diperbarui' }
  // #swagger.responses[404] = { description: 'Like tidak ditemukan' }
  return likeController.deleteLike(req, res);
});

export { likeRouter };