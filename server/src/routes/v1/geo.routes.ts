import { Router } from 'express';

import * as geoController from '../../controllers/geoController.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const geoRouter = Router();

geoRouter.get('/region', asyncHandler(geoController.getDetectedRegion));

export { geoRouter };
