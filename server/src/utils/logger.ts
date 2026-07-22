import winston from 'winston';

import { env } from '../config/env.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaKeys = Object.keys(meta);
  const metaText = metaKeys.length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const stackText = stack ? `\n${String(stack)}` : '';
  return `${String(ts)} [${level}] ${String(message)}${metaText}${stackText}`;
});

export const logger = winston.createLogger({
  level: env.logLevel,
  defaultMeta: { service: 'gidy-security-api' },
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console({
      format: env.isProduction
        ? combine(timestamp(), errors({ stack: true }), json())
        : combine(colorize(), timestamp(), errors({ stack: true }), consoleFormat),
    }),
  ],
});
