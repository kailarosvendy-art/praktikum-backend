import { Router } from 'express';
import { FlagController } from '../controllers/flagController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';

const flagRouter = Router();
const flagController = new FlagController();

flagRouter.use(authenticate, authorizeRoles('admin'));

flagRouter.get('/', (_req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.responses[200] = { description: 'Daftar flag beserta data pelapor dan review' }
  return flagController.getFlags(_req, res);
});

flagRouter.put('/:id', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/FlagStatusUpdate' } }
  // #swagger.responses[200] = { description: 'Status flag berhasil diperbarui' }
  // #swagger.responses[404] = { description: 'Flag tidak ditemukan' }
  return flagController.updateFlagStatus(req, res);
});

export { flagRouter };