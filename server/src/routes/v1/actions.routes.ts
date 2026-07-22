import { Router } from 'express';

import * as actionController from '../../controllers/actionController.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { executeActionSchema } from '../../validators/actionValidators.js';

const actionsRouter = Router();

actionsRouter.get('/', asyncHandler(actionController.listActions));

actionsRouter.post(
  '/',
  validateRequest({ body: executeActionSchema }),
  asyncHandler(actionController.executeAction),
);

export { actionsRouter };
