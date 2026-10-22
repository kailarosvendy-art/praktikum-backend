import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { StallController } from '../controllers/stallController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';
import { validate } from '../middlewares/validate.ts';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';
import {
  createStallReviewBodySchema,
  createStallReviewParamsSchema,
} from '../schemas/reviewSchema.ts';

export function createStallRouter(
  stallController = new StallController(),
  reviewController = new ReviewController(),
): Router {
  const stallRouter = Router();

  stallRouter.get('/', validate(stallQuerySchema, 'query'), (req, res, next) => {
    // #swagger.parameters['search']   = { in: 'query', type: 'string' }
    // #swagger.parameters['category'] = { in: 'query', type: 'string' }
    // #swagger.parameters['page']     = { in: 'query', type: 'integer' }
    // #swagger.parameters['limit']    = { in: 'query', type: 'integer' }
    // #swagger.responses[200] = { description: 'Daftar warung' }
    // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
    return stallController.getStalls(req, res, next);
  });

  stallRouter.post(
    '/',
    authenticate,
    authorizeRoles('owner', 'admin'),
    validate(createStallSchema, 'body'),
    (req, res, next) => {
      // #swagger.security = [{ "bearerAuth": [] }]
      // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
      // #swagger.responses[201] = { description: 'Warung dibuat; ownerId diambil dari token' }
      // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
      // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
      // #swagger.responses[403] = { description: 'Role tidak memiliki akses' }
      return stallController.createStall(req, res, next);
    },
  );

  stallRouter.get('/:id', validate(idParamSchema, 'params'), (req, res, next) => {
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Detail warung' }
    // #swagger.responses[404] = { description: 'Tidak ditemukan' }
    // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
    return stallController.getStallById(req, res, next);
  });

  stallRouter.put(
    '/:id',
    authenticate,
    authorizeRoles('owner', 'admin'),
    validate(idParamSchema, 'params'),
    validate(updateStallSchema, 'body'),
    (req, res, next) => {
      // #swagger.security = [{ "bearerAuth": [] }]
      // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallUpdate' } }
      // #swagger.responses[200] = { description: 'Warung ter-update' }
      // #swagger.responses[404] = { description: 'Tidak ditemukan' }
      // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
      // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
      // #swagger.responses[403] = { description: 'Role tidak diizinkan atau warung bukan milik owner' }
      return stallController.updateStall(req, res, next);
    },
  );

  stallRouter.delete(
    '/:id',
    authenticate,
    authorizeRoles('admin'),
    validate(idParamSchema, 'params'),
    (req, res, next) => {
      // #swagger.security = [{ "bearerAuth": [] }]
      // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      // #swagger.responses[200] = { description: 'Warung terhapus' }
      // #swagger.responses[404] = { description: 'Tidak ditemukan' }
      // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
      // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
      // #swagger.responses[403] = { description: 'Hanya admin dapat menghapus warung' }
      return stallController.deleteStall(req, res, next);
    },
  );

  stallRouter.post(
    '/:id/reviews',
    authenticate,
    validate(createStallReviewParamsSchema, 'params'),
    validate(createStallReviewBodySchema, 'body'),
    (req, res, next) => {
      // #swagger.security = [{ "bearerAuth": [] }]
      // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallReviewInput' } }
      // #swagger.responses[201] = { description: 'Review dibuat dengan userId dari token' }
      // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
      // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
      // #swagger.responses[404] = { description: 'Warung tidak ditemukan' }
      // #swagger.responses[409] = { description: 'User sudah memberi review untuk warung ini' }
      return reviewController.createStallReview(req, res, next);
    },
  );

  stallRouter.get(
    '/:id/menus',
    authenticate,
    authorizeRoles('admin'),
    validate(idParamSchema, 'params'),
    (req, res, next) => {
      // #swagger.security = [{ "bearerAuth": [] }]
      // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      // #swagger.responses[200] = { description: 'Daftar menu' }
      // #swagger.responses[404] = { description: 'Tidak ditemukan' }
      // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
      // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
      // #swagger.responses[403] = { description: 'Endpoint hanya tersedia untuk admin' }
      return stallController.getStallMenus(req, res, next);
    },
  );

  return stallRouter;
}

export const stallRouter = createStallRouter();
