export interface DeviceInfo {
  browser: string;
  deviceType: string;
  deviceName: string;
  osName: string;
  userAgent: string;
}

export function useDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;

  // Simple device detection
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isWindows = /windows/i.test(userAgent);
  const isMac = /macintosh|mac os/i.test(userAgent);

  let deviceType = "desktop";
  if (isAndroid || isIOS) deviceType = "mobile";
  else if (/tablet|ipad/i.test(userAgent)) deviceType = "tablet";

  let browser = "Unknown";
  let osName = "Unknown";

  // Browser detection
  if (/edge/i.test(userAgent)) browser = "Edge";
  else if (/chrome/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
  else if (/firefox/i.test(userAgent)) browser = "Firefox";
  else if (/opera|opr/i.test(userAgent)) browser = "Opera";

  // OS detection
  if (isWindows) osName = "Windows";
  else if (isMac) osName = "macOS";
  else if (isAndroid) osName = "Android";
  else if (isIOS) osName = "iOS";
  else if (/linux/i.test(userAgent)) osName = "Linux";

  // Device name
  let deviceName = "Unknown Device";
  if (isIOS) {
    if (/iphone/i.test(userAgent)) deviceName = "iPhone";
    else if (/ipad/i.test(userAgent)) deviceName = "iPad";
    else if (/ipod/i.test(userAgent)) deviceName = "iPod";
  } else if (isAndroid) {
    const androidMatch = userAgent.match(/Android\s([0-9.]*)/);
    deviceName = `Android Device`;
  }

  return {
    browser,
    deviceType,
    deviceName,
    osName,
    userAgent,
  };
}
