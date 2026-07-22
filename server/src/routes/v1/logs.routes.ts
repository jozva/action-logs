import { Router } from 'express';

import * as logController from '../../controllers/logController.js';
import { createUploadRateLimiter } from '../../middlewares/security.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  bulkUploadSchema,
  listLogsQuerySchema,
  logIdParamsSchema,
} from '../../validators/logValidators.js';

const logsRouter = Router();

logsRouter.get(
  '/',
  validateRequest({ query: listLogsQuerySchema }),
  asyncHandler(logController.listLogs),
);

logsRouter.get(
  '/summary',
  asyncHandler(logController.getDashboardSummary),
);

logsRouter.get(
  '/:id',
  validateRequest({ params: logIdParamsSchema }),
  asyncHandler(logController.getLogById),
);

logsRouter.post(
  '/upload',
  createUploadRateLimiter(),
  validateRequest({ body: bulkUploadSchema }),
  asyncHandler(logController.bulkUploadLogs),
);

export { logsRouter };
