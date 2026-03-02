/**
 * Device and platform detection utilities
 */

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  touchSupport: boolean;
}

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detect platform
  let platform: DeviceInfo['platform'] = 'unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    platform = 'ios';
  } else if (/Android/i.test(ua)) {
    platform = 'android';
  } else if (/Win/i.test(ua)) {
    platform = 'windows';
  } else if (/Mac/i.test(ua)) {
    platform = 'macos';
  } else if (/Linux/i.test(ua)) {
    platform = 'linux';
  }

  // Detect device type
  let deviceType: DeviceInfo['deviceType'] = 'desktop';
  
  // Check for mobile indicators
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  
  if (tabletRegex.test(ua)) {
    deviceType = 'tablet';
  } else if (mobileRegex.test(ua)) {
    deviceType = 'mobile';
  } else if (touchSupport && screenWidth < 1024) {
    // Touch support on smaller screens might indicate tablet/mobile
    deviceType = screenWidth < 768 ? 'mobile' : 'tablet';
  }

  // Detect browser
  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/MSIE|Trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  return {
    deviceType,
    platform,
    browser,
    userAgent: ua,
    screenWidth,
    screenHeight,
    touchSupport,
  };
}

export function getDeviceSummary(info: DeviceInfo): string {
  return `${info.deviceType} - ${info.platform} - ${info.browser} (${info.screenWidth}x${info.screenHeight})`;
}
