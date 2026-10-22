import { Router } from 'express';
import { MenuItemController } from '../controllers/menuItemController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';

const menuItemRouter = Router();
const menuItemController = new MenuItemController();

menuItemRouter.use(authenticate, authorizeRoles('admin'));

menuItemRouter.get('/', (_req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.responses[200] = { description: 'Daftar menu beserta data warung' }
  return menuItemController.getMenuItems(_req, res);
});

menuItemRouter.post('/', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemInput' } }
  // #swagger.responses[201] = { description: 'Menu berhasil dibuat beserta data warung' }
  return menuItemController.createMenuItem(req, res);
});

menuItemRouter.get('/:id', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail menu beserta data warung' }
  // #swagger.responses[404] = { description: 'Menu tidak ditemukan' }
  return menuItemController.getMenuItemById(req, res);
});

menuItemRouter.put('/:id', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemUpdate' } }
  // #swagger.responses[200] = { description: 'Menu berhasil diubah beserta data warung' }
  // #swagger.responses[404] = { description: 'Menu atau warung tidak ditemukan' }
  return menuItemController.updateMenuItem(req, res);
});

menuItemRouter.delete('/:id', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Menu berhasil dihapus' }
  // #swagger.responses[404] = { description: 'Menu tidak ditemukan' }
  return menuItemController.deleteMenuItem(req, res);
});

export { menuItemRouter };