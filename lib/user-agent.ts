// Minimal user-agent classification for the security audit trail
// (LoginHistory / UserSession). Intentionally dependency-free.

export function describeBrowser(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent;

  if (/\bEdg\/(\d+)/i.test(ua)) return `Edge ${firstMatch(ua, /Edg\/(\d+)/)}`;
  if (/\bOPR\/(\d+)/i.test(ua)) return `Opera ${firstMatch(ua, /OPR\/(\d+)/)}`;
  if (/\bChrome\/(\d+)/i.test(ua)) return `Chrome ${firstMatch(ua, /Chrome\/(\d+)/)}`;
  if (/\bFirefox\/(\d+)/i.test(ua)) return `Firefox ${firstMatch(ua, /Firefox\/(\d+)/)}`;
  if (/\bVersion\/(\d+).*\bSafari\b/i.test(ua)) return `Safari ${firstMatch(ua, /Version\/(\d+)/)}`;

  return "Unknown";
}

export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent;

  if (/\b(iPhone|iPad|iPod)\b/i.test(ua)) return "iOS";
  if (/\bAndroid\b/i.test(ua)) return /\bMobile\b/i.test(ua) ? "Android Mobile" : "Android Tablet";
  if (/\bMacintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/\bWindows\b/i.test(ua)) return "Windows";
  if (/\bCrOS\b/i.test(ua)) return "ChromeOS";
  if (/\bLinux\b/i.test(ua)) return "Linux";

  return "Unknown";
}

function firstMatch(input: string, pattern: RegExp): string {
  const match = input.match(pattern);
  return match && match[1] ? match[1] : "";
}
