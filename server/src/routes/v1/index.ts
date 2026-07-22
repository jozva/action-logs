import { Router } from 'express';

import { logsRouter } from './logs.routes.js';

const v1Router = Router();

v1Router.use('/logs', logsRouter);

export { v1Router };
