import { DEFAULT_ACTION_REGION } from '../constants/actions.js';
import { logger } from '../utils/logger.js';

export interface DetectedRegion {
  region: string;
  ipAddress: string;
  source: 'geoip' | 'timezone' | 'default';
  countryCode?: string;
  timezone?: string;
}

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1|0:0:0:0:0:0:0:1|localhost)/i;

const COUNTRY_TO_REGION: Record<string, string> = {
  IN: 'ap-south-1',
  SG: 'ap-southeast-1',
  AU: 'ap-southeast-2',
  JP: 'ap-northeast-1',
  KR: 'ap-northeast-2',
  US: 'us-east-1',
  CA: 'us-east-1',
  GB: 'eu-west-2',
  IE: 'eu-west-1',
  DE: 'eu-central-1',
  FR: 'eu-west-3',
  NL: 'eu-west-1',
  BR: 'sa-east-1',
  AE: 'me-central-1',
};

const TIMEZONE_TO_REGION: Record<string, string> = {
  'Asia/Kolkata': 'ap-south-1',
  'Asia/Calcutta': 'ap-south-1',
  'Asia/Singapore': 'ap-southeast-1',
  'Asia/Tokyo': 'ap-northeast-1',
  'Asia/Seoul': 'ap-northeast-2',
  'Australia/Sydney': 'ap-southeast-2',
  'America/New_York': 'us-east-1',
  'America/Chicago': 'us-east-1',
  'America/Denver': 'us-west-2',
  'America/Los_Angeles': 'us-west-2',
  'America/Toronto': 'us-east-1',
  'Europe/London': 'eu-west-2',
  'Europe/Dublin': 'eu-west-1',
  'Europe/Berlin': 'eu-central-1',
  'Europe/Paris': 'eu-west-3',
  'Europe/Amsterdam': 'eu-west-1',
  'America/Sao_Paulo': 'sa-east-1',
  'Asia/Dubai': 'me-central-1',
};

const regionCache = new Map<string, { value: DetectedRegion; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function isPrivateIp(ipAddress: string): boolean {
  return PRIVATE_IP_PATTERN.test(ipAddress);
}

function regionFromTimezone(timezone?: string): string | undefined {
  if (!timezone) {
    return undefined;
  }
  if (TIMEZONE_TO_REGION[timezone]) {
    return TIMEZONE_TO_REGION[timezone];
  }

  if (timezone.startsWith('Asia/')) return 'ap-south-1';
  if (timezone.startsWith('Europe/')) return 'eu-west-1';
  if (timezone.startsWith('America/')) return 'us-east-1';
  if (timezone.startsWith('Australia/')) return 'ap-southeast-2';
  return undefined;
}

async function lookupPublicIpRegion(ipAddress: string): Promise<DetectedRegion | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ipAddress)}?fields=status,countryCode,timezone,query`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      status?: string;
      countryCode?: string;
      timezone?: string;
      query?: string;
    };

    if (payload.status !== 'success' || !payload.countryCode) {
      return null;
    }

    const region =
      COUNTRY_TO_REGION[payload.countryCode] ??
      regionFromTimezone(payload.timezone) ??
      DEFAULT_ACTION_REGION;

    return {
      region,
      ipAddress: payload.query || ipAddress,
      source: 'geoip',
      countryCode: payload.countryCode,
      timezone: payload.timezone,
    };
  } catch (error) {
    logger.warn('GeoIP lookup failed', {
      ipAddress,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

export async function detectRegion(options: {
  ipAddress: string;
  timezone?: string;
}): Promise<DetectedRegion> {
  const cacheKey = `${options.ipAddress}|${options.timezone ?? ''}`;
  const cached = regionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let detected: DetectedRegion;

  if (!isPrivateIp(options.ipAddress)) {
    const geo = await lookupPublicIpRegion(options.ipAddress);
    if (geo) {
      detected = geo;
    } else {
      const timezoneRegion = regionFromTimezone(options.timezone);
      detected = {
        region: timezoneRegion ?? DEFAULT_ACTION_REGION,
        ipAddress: options.ipAddress,
        source: timezoneRegion ? 'timezone' : 'default',
        timezone: options.timezone,
      };
    }
  } else {
    const timezoneRegion = regionFromTimezone(options.timezone);
    detected = {
      region: timezoneRegion ?? DEFAULT_ACTION_REGION,
      ipAddress: options.ipAddress,
      source: timezoneRegion ? 'timezone' : 'default',
      timezone: options.timezone,
    };
  }

  regionCache.set(cacheKey, {
    value: detected,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return detected;
}
