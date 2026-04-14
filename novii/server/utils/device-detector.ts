import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

export interface DetectedDevice {
  browser: string;
  browserVersion: string;
  deviceType: string;
  deviceName: string;
  deviceModel: string;
  osName: string;
  osVersion: string;
}

export interface ClientFingerprint {
  screenResolution?: string;
  timezone?: string;
  language?: string;
  colorDepth?: number;
  pixelRatio?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  platform?: string;
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
}

const geoCache = new Map<string, { data: GeoLocation; expiry: number }>();
const GEO_CACHE_TTL = 1000 * 60 * 60;

export function parseUserAgent(userAgent: string): DetectedDevice {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const vendor = result.device.vendor || '';
  const model = result.device.model || '';
  let deviceName = `${vendor} ${model}`.trim();
  if (!deviceName) {
    const os = result.os.name || '';
    if (os.includes('Mac') || os.includes('iOS')) deviceName = os.includes('iOS') ? 'iPhone' : 'Mac';
    else if (os.includes('Windows')) deviceName = 'Windows PC';
    else if (os.includes('Android')) deviceName = 'Android Device';
    else if (os.includes('Linux')) deviceName = 'Linux PC';
    else deviceName = 'Unknown Device';
  }

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    deviceType: result.device.type || 'desktop',
    deviceName,
    deviceModel: result.device.model || 'Unknown',
    osName: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
  };
}

export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    if (ip && ip !== '::1' && ip !== '127.0.0.1') return ip;
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp && realIp !== '::1' && realIp !== '127.0.0.1') return realIp;
  const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress;
  return socketIp || 'Unknown';
}

export async function getGeoLocation(ip: string): Promise<GeoLocation> {
  const fallback: GeoLocation = { country: 'Unknown', countryCode: 'XX', city: 'Unknown' };

  if (!ip || ip === 'Unknown' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return fallback;
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiry > Date.now()) return cached.data;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();

    if (data.status === 'success') {
      const geo: GeoLocation = {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        city: data.city || 'Unknown',
      };
      geoCache.set(ip, { data: geo, expiry: Date.now() + GEO_CACHE_TTL });
      return geo;
    }
  } catch (error) {
    console.error('Geolocation fetch error:', error);
  }

  return fallback;
}

export function generateDeviceFingerprint(
  device: DetectedDevice,
  clientFingerprint?: ClientFingerprint
): string {
  const components = [
    device.browser,
    device.osName,
    device.deviceType,
    device.deviceModel,
    clientFingerprint?.screenResolution || '',
    clientFingerprint?.timezone || '',
    clientFingerprint?.language || '',
    clientFingerprint?.platform || '',
    String(clientFingerprint?.hardwareConcurrency || ''),
    String(clientFingerprint?.maxTouchPoints || ''),
  ];

  const raw = components.filter(Boolean).join('|').toLowerCase();
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const MAX_DEVICES_PER_USER = 10;
export { MAX_DEVICES_PER_USER };
