import { UAParser } from 'ua-parser-js';

export interface DetectedDevice {
  browser: string;
  browserVersion: string;
  deviceType: string;
  deviceName: string;
  deviceModel: string;
  osName: string;
  osVersion: string;
}

export function parseUserAgent(userAgent: string): DetectedDevice {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    deviceType: result.device.type || 'desktop',
    deviceName: `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || 'Unknown Device',
    deviceModel: result.device.model || 'Unknown',
    osName: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
  };
}

export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
  }
  return req.socket.remoteAddress || req.connection.remoteAddress || 'Unknown';
}

export async function getGeoLocation(ip: string): Promise<{ country: string; countryCode: string; city: string }> {
  try {
    // Using IP-API (free tier: 45 requests/minute, up to 144,000/day)
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        city: data.city || 'Unknown',
      };
    }
  } catch (error) {
    console.error('Geolocation fetch error:', error);
  }

  return {
    country: 'Unknown',
    countryCode: 'XX',
    city: 'Unknown',
  };
}
