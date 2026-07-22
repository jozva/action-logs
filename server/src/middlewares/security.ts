import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { ErrorRequestHandler, Express, RequestHandler } from 'express';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';

import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/http.js';
import { TooManyRequestsError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export function createGeneralRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
      throw new TooManyRequestsError(
        'Rate limit exceeded. Please retry after the window resets.',
      );
    },
  });
}

export function createUploadRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.uploadRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
      throw new TooManyRequestsError(
        'Upload rate limit exceeded. Please retry later.',
      );
    },
  });
}

export function applySecurityMiddleware(app: Express): void {
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS origin denied'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 600,
    }),
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: env.bodyLimit, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.bodyLimit }));
  app.use(
    mongoSanitize({
      replaceWith: '_',
      allowDots: false,
    }),
  );
  app.use(
    hpp({
      whitelist: [
        'role',
        'severity',
        'status',
        'action',
        'resourceType',
        'region',
      ],
    }),
  );

  app.use(
    morgan(env.isProduction ? 'combined' : 'dev', {
      stream: morganStream,
      skip: (req) => req.path === '/health',
    }),
  );

  app.use(createGeneralRateLimiter());

  const corsErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (error instanceof Error && error.message === 'CORS origin denied') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'CORS origin not allowed',
        data: null,
        code: 'CORS_DENIED',
      });
      return;
    }
    next(error);
  };

  app.use(corsErrorHandler);
}
