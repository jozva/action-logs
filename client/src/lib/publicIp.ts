let cachedPublicIp: { value: string; expiresAt: number } | null = null
const CACHE_TTL_MS = 30 * 60 * 1000

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/
const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/

function isPublicIpv4(ip: string): boolean {
  return IPV4_PATTERN.test(ip) && !PRIVATE_IP_PATTERN.test(ip)
}

export async function discoverBrowserPublicIp(): Promise<string | null> {
  if (cachedPublicIp && cachedPublicIp.expiresAt > Date.now()) {
    return cachedPublicIp.value
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2500),
    })
    if (!response.ok) {
      return null
    }
    const payload = (await response.json()) as { ip?: string }
    if (payload.ip && isPublicIpv4(payload.ip)) {
      cachedPublicIp = {
        value: payload.ip,
        expiresAt: Date.now() + CACHE_TTL_MS,
      }
      return payload.ip
    }
  } catch {
    return null
  }

  return null
}
