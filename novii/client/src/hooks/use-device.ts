export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  deviceType: string;
  deviceName: string;
  osName: string;
  osVersion: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
}

export function useDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;

  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isWindows = /windows/i.test(userAgent);
  const isMac = /macintosh|mac os/i.test(userAgent);

  let deviceType = "desktop";
  if (/tablet|ipad/i.test(userAgent)) deviceType = "tablet";
  else if (isAndroid || isIOS) deviceType = "mobile";

  let browser = "Unknown";
  let browserVersion = "";
  if (/edg/i.test(userAgent)) {
    browser = "Edge";
    browserVersion = userAgent.match(/Edg\/([\d.]+)/)?.[1] || '';
  } else if (/opr|opera/i.test(userAgent)) {
    browser = "Opera";
    browserVersion = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/)?.[1] || '';
  } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = "Chrome";
    browserVersion = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || '';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
    browserVersion = userAgent.match(/Version\/([\d.]+)/)?.[1] || '';
  } else if (/firefox/i.test(userAgent)) {
    browser = "Firefox";
    browserVersion = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || '';
  }

  let osName = "Unknown";
  let osVersion = "";
  if (isWindows) {
    osName = "Windows";
    osVersion = userAgent.match(/Windows NT ([\d.]+)/)?.[1] || '';
  } else if (isMac) {
    osName = "macOS";
    osVersion = userAgent.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (isAndroid) {
    osName = "Android";
    osVersion = userAgent.match(/Android ([\d.]+)/)?.[1] || '';
  } else if (isIOS) {
    osName = "iOS";
    osVersion = userAgent.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (/linux/i.test(userAgent)) {
    osName = "Linux";
  }

  let deviceName = "Unknown Device";
  if (isIOS) {
    if (/iphone/i.test(userAgent)) deviceName = "iPhone";
    else if (/ipad/i.test(userAgent)) deviceName = "iPad";
    else if (/ipod/i.test(userAgent)) deviceName = "iPod";
  } else if (isAndroid) {
    const match = userAgent.match(/;\s*([^;)]+)\s*Build/);
    deviceName = match ? match[1].trim() : "Android Device";
  } else if (isMac) {
    deviceName = "Mac";
  } else if (isWindows) {
    deviceName = "Windows PC";
  } else if (/linux/i.test(userAgent)) {
    deviceName = "Linux PC";
  }

  return {
    browser,
    browserVersion,
    deviceType,
    deviceName,
    osName,
    osVersion,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    userAgent,
  };
}
