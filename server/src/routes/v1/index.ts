import { Router } from 'express';

import { actionsRouter } from './actions.routes.js';
import { authRouter } from './auth.routes.js';
import { exportsRouter } from './exports.routes.js';
import { filesRouter } from './files.routes.js';
import { logsRouter } from './logs.routes.js';
import { policiesRouter } from './policies.routes.js';
import { usersRouter } from './users.routes.js';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/files', filesRouter);
v1Router.use('/exports', exportsRouter);
v1Router.use('/policies', policiesRouter);
v1Router.use('/logs', logsRouter);
v1Router.use('/actions', actionsRouter);

export { v1Router };
