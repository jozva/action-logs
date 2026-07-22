import { Router } from 'express';

import { PERMISSIONS } from '../../constants/permissions.js';
import * as fileController from '../../controllers/fileController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  resourceIdParamsSchema,
  uploadFileSchema,
} from '../../validators/resourceValidators.js';

const filesRouter = Router();

filesRouter.use(authenticate);

filesRouter.get(
  '/',
  authorize(PERMISSIONS.FILE_READ),
  asyncHandler(fileController.listFiles),
);

filesRouter.post(
  '/',
  authorize(PERMISSIONS.FILE_UPLOAD),
  validateRequest({ body: uploadFileSchema }),
  asyncHandler(fileController.uploadFile),
);

filesRouter.post(
  '/:id/download',
  authorize(PERMISSIONS.FILE_DOWNLOAD),
  validateRequest({ params: resourceIdParamsSchema }),
  asyncHandler(fileController.downloadFile),
);

export { filesRouter };
