import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorizeRoles } from '../middlewares/authorizeRoles.ts';
import { validate } from '../middlewares/validate.ts';
import { idParamSchema } from '../schemas/stallSchema.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();

reviewRouter.get('/', authenticate, authorizeRoles('admin'), (_req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin dapat mengakses endpoint ini' }
  // #swagger.responses[200] = { description: 'Daftar review beserta data user' }
  return reviewController.getReviews(_req, res);
});

reviewRouter.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  validate(idParamSchema, 'params'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Review berhasil dihapus' }
    // #swagger.responses[404] = { description: 'Review tidak ditemukan' }
    // #swagger.responses[400] = { description: 'Input tidak valid', schema: { $ref: '#/definitions/ValidationError' } }
    // #swagger.responses[401] = { description: 'Token tidak ada atau tidak valid' }
    // #swagger.responses[403] = { description: 'Hanya admin dapat menghapus review' }
    return reviewController.deleteReview(req, res);
  },
);

export { reviewRouter };