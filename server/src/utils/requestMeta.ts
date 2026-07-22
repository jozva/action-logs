import type { Request } from 'express';

import { DEFAULT_ACTION_REGION } from '../constants/actions.js';
import {
  detectRegion,
  isPublicIpv4,
  resolveEffectivePublicIp,
  type DetectedRegion,
} from '../services/geoService.js';

export function resolveRequestIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first.replace(/^::ffff:/, '');
    }
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim().replace(/^::ffff:/, '');
  }

  const ip = (req.ip || '').replace(/^::ffff:/, '');
  if (!ip || ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}

export function resolveClientTimezone(req: Request): string | undefined {
  const header = req.headers['x-client-timezone'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }
  return undefined;
}

export function resolveClientPublicIpHint(req: Request): string | undefined {
  const header = req.headers['x-client-public-ip'];
  if (typeof header === 'string' && isPublicIpv4(header.trim())) {
    return header.trim();
  }
  return undefined;
}

export async function resolveRequestRegionMeta(req: Request): Promise<DetectedRegion> {
  const connectionIp = resolveRequestIp(req);
  const effective = await resolveEffectivePublicIp({
    connectionIp,
    clientHintIp: resolveClientPublicIpHint(req),
  });

  return detectRegion({
    ipAddress: effective.ipAddress,
    connectionIp,
    ipSource: effective.ipSource,
    timezone: resolveClientTimezone(req),
  });
}

/** @deprecated Prefer resolveRequestRegionMeta for accurate detection */
export function resolveRequestRegion(_req: Request, fallback?: string): string {
  return fallback || DEFAULT_ACTION_REGION;
}
