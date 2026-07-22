import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './database/connection.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`API listening on port ${env.port}`, {
      env: env.nodeEnv,
      corsOrigins: env.corsOrigins,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      const { disconnectDatabase } = await import('./database/connection.js');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to start server', {
    message: error instanceof Error ? error.message : 'Unknown bootstrap error',
  });
  process.exit(1);
});
