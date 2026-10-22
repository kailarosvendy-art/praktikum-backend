import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';

const auditRouter = Router();
const auditController = new AuditController();

auditRouter.use(authenticate, authorizeRoles('admin'));

auditRouter.get('/', (_req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.responses[200] = { description: 'Daftar audit beserta identitas admin dari token' }
  return auditController.getAuditLogs(_req, res);
});

auditRouter.post('/', (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/AuditInput' } }
  // #swagger.responses[201] = { description: 'Audit log dibuat dengan userId dari token admin' }
  // #swagger.responses[404] = { description: 'User tidak ditemukan' }
  return auditController.createAuditLog(req, res);
});

export { auditRouter };