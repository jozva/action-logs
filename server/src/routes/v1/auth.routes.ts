import { Router } from 'express';

import * as authController from '../../controllers/authController.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { loginSchema, registerSchema } from '../../validators/authValidators.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateRequest({ body: registerSchema }),
  asyncHandler(authController.register),
);

authRouter.post(
  '/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(authController.login),
);

authRouter.get('/me', authenticate, asyncHandler(authController.me));

authRouter.post('/logout', authenticate, asyncHandler(authController.logout));

export { authRouter };
