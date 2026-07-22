import { Router } from 'express';

import { PERMISSIONS } from '../../constants/permissions.js';
import * as policyController from '../../controllers/policyController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  resourceIdParamsSchema,
  updatePolicySchema,
} from '../../validators/resourceValidators.js';

const policiesRouter = Router();

policiesRouter.use(authenticate);

policiesRouter.get(
  '/',
  authorize(PERMISSIONS.POLICY_READ),
  asyncHandler(policyController.listPolicies),
);

policiesRouter.patch(
  '/:id',
  authorize(PERMISSIONS.POLICY_UPDATE),
  validateRequest({ params: resourceIdParamsSchema, body: updatePolicySchema }),
  asyncHandler(policyController.updatePolicy),
);

export { policiesRouter };
