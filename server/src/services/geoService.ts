import { DEFAULT_ACTION_REGION } from '../constants/actions.js';
import { logger } from '../utils/logger.js';

export interface DetectedRegion {
  region: string;
  ipAddress: string;
  connectionIp: string;
  source: 'geoip' | 'timezone' | 'default';
  ipSource: 'connection' | 'egress' | 'client-hint';
  countryCode?: string;
  timezone?: string;
}

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1|0:0:0:0:0:0:0:1|localhost)/i;

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

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

let cachedEgressIp: { value: string; expiresAt: number } | null = null;

export function isPrivateIp(ipAddress: string): boolean {
  return PRIVATE_IP_PATTERN.test(ipAddress);
}

export function isPublicIpv4(ipAddress: string): boolean {
  return IPV4_PATTERN.test(ipAddress) && !isPrivateIp(ipAddress);
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

async function fetchJsonWithTimeout(
  url: string,
  timeoutMs = 2500,
): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    logger.warn('Network lookup failed', {
      url,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

/**
 * Discovers this machine's public/WAN IP when the inbound request is private
 * (localhost / LAN). Uses outbound egress lookup against a public IP service.
 */
export async function discoverMachinePublicIp(): Promise<string | null> {
  if (cachedEgressIp && cachedEgressIp.expiresAt > Date.now()) {
    return cachedEgressIp.value;
  }

  const ipify = (await fetchJsonWithTimeout('https://api.ipify.org?format=json')) as
    | { ip?: string }
    | null;
  if (ipify?.ip && isPublicIpv4(ipify.ip)) {
    cachedEgressIp = { value: ipify.ip, expiresAt: Date.now() + CACHE_TTL_MS };
    return ipify.ip;
  }

  const ipApi = (await fetchJsonWithTimeout(
    'http://ip-api.com/json/?fields=status,query',
  )) as { status?: string; query?: string } | null;
  if (ipApi?.status === 'success' && ipApi.query && isPublicIpv4(ipApi.query)) {
    cachedEgressIp = {
      value: ipApi.query,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return ipApi.query;
  }

  return null;
}

async function lookupPublicIpRegion(ipAddress: string): Promise<{
  region: string;
  ipAddress: string;
  countryCode?: string;
  timezone?: string;
} | null> {
  const payload = (await fetchJsonWithTimeout(
    `http://ip-api.com/json/${encodeURIComponent(ipAddress)}?fields=status,countryCode,timezone,query`,
  )) as {
    status?: string;
    countryCode?: string;
    timezone?: string;
    query?: string;
  } | null;

  if (!payload || payload.status !== 'success' || !payload.countryCode) {
    return null;
  }

  const region =
    COUNTRY_TO_REGION[payload.countryCode] ??
    regionFromTimezone(payload.timezone) ??
    DEFAULT_ACTION_REGION;

  return {
    region,
    ipAddress: payload.query || ipAddress,
    countryCode: payload.countryCode,
    timezone: payload.timezone,
  };
}

export async function resolveEffectivePublicIp(options: {
  connectionIp: string;
  clientHintIp?: string;
}): Promise<{ ipAddress: string; ipSource: DetectedRegion['ipSource'] }> {
  if (!isPrivateIp(options.connectionIp)) {
    return { ipAddress: options.connectionIp, ipSource: 'connection' };
  }

  if (options.clientHintIp && isPublicIpv4(options.clientHintIp)) {
    return { ipAddress: options.clientHintIp, ipSource: 'client-hint' };
  }

  const egressIp = await discoverMachinePublicIp();
  if (egressIp) {
    return { ipAddress: egressIp, ipSource: 'egress' };
  }

  return { ipAddress: options.connectionIp, ipSource: 'connection' };
}

export async function detectRegion(options: {
  ipAddress: string;
  connectionIp: string;
  ipSource: DetectedRegion['ipSource'];
  timezone?: string;
}): Promise<DetectedRegion> {
  const cacheKey = `${options.ipAddress}|${options.timezone ?? ''}|${options.ipSource}`;
  const cached = regionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let detected: DetectedRegion;

  if (!isPrivateIp(options.ipAddress)) {
    const geo = await lookupPublicIpRegion(options.ipAddress);
    if (geo) {
      detected = {
        region: geo.region,
        ipAddress: geo.ipAddress,
        connectionIp: options.connectionIp,
        source: 'geoip',
        ipSource: options.ipSource,
        countryCode: geo.countryCode,
        timezone: geo.timezone ?? options.timezone,
      };
    } else {
      const timezoneRegion = regionFromTimezone(options.timezone);
      detected = {
        region: timezoneRegion ?? DEFAULT_ACTION_REGION,
        ipAddress: options.ipAddress,
        connectionIp: options.connectionIp,
        source: timezoneRegion ? 'timezone' : 'default',
        ipSource: options.ipSource,
        timezone: options.timezone,
      };
    }
  } else {
    const timezoneRegion = regionFromTimezone(options.timezone);
    detected = {
      region: timezoneRegion ?? DEFAULT_ACTION_REGION,
      ipAddress: options.ipAddress,
      connectionIp: options.connectionIp,
      source: timezoneRegion ? 'timezone' : 'default',
      ipSource: options.ipSource,
      timezone: options.timezone,
    };
  }

  regionCache.set(cacheKey, {
    value: detected,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return detected;
}
