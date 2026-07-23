import { Router } from 'express';

import { PERMISSIONS } from '../../constants/permissions.js';
import * as exportController from '../../controllers/exportController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const exportsRouter = Router();

exportsRouter.use(authenticate);

exportsRouter.post(
  '/',
  authorize(PERMISSIONS.EXPORT_CREATE),
  asyncHandler(exportController.createExport),
);

exportsRouter.get(
  '/download',
  authorize(PERMISSIONS.EXPORT_CREATE),
  asyncHandler(exportController.downloadExport),
);

export { exportsRouter };
