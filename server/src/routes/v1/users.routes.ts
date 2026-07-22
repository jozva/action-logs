import { Router } from 'express';

import * as userController from '../../controllers/userController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
} from '../../validators/authValidators.js';

const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  '/',
  authorize(PERMISSIONS.USER_READ),
  asyncHandler(userController.listUsers),
);

usersRouter.post(
  '/',
  authorize(PERMISSIONS.USER_CREATE),
  validateRequest({ body: createUserSchema }),
  asyncHandler(userController.createUser),
);

usersRouter.patch(
  '/:id',
  authorize(PERMISSIONS.USER_UPDATE),
  validateRequest({ params: userIdParamsSchema, body: updateUserSchema }),
  asyncHandler(userController.updateUser),
);

usersRouter.delete(
  '/:id',
  authorize(PERMISSIONS.USER_DELETE),
  validateRequest({ params: userIdParamsSchema }),
  asyncHandler(userController.deleteUser),
);

export { usersRouter };
