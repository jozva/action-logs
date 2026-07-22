import type { Request } from 'express';

import { DEFAULT_ACTION_REGION } from '../constants/actions.js';

export function resolveRequestIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first.replace(/^::ffff:/, '');
    }
  }

  const ip = (req.ip || '').replace(/^::ffff:/, '');
  if (!ip || ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}

export function resolveRequestRegion(_req: Request, fallback?: string): string {
  return fallback || DEFAULT_ACTION_REGION;
}
