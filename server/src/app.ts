import express from 'express';

import { applySecurityMiddleware } from './middlewares/security.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { v1Router } from './routes/v1/index.js';

export function createApp() {
  const app = express();

  applySecurityMiddleware(app);

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Gidy Security Logs API',
      data: {
        name: 'gidy-security-api',
        version: 'v1',
        docs: '/api/v1/logs',
      },
    });
  });

  app.use('/health', healthRouter);
  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
