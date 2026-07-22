import { Router } from 'express';

import * as healthController from '../controllers/healthController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const healthRouter = Router();

healthRouter.get('/', asyncHandler(healthController.getHealth));

export { healthRouter };
