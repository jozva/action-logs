import { Router } from 'express';

import { actionsRouter } from './actions.routes.js';
import { logsRouter } from './logs.routes.js';

const v1Router = Router();

v1Router.use('/logs', logsRouter);
v1Router.use('/actions', actionsRouter);

export { v1Router };
