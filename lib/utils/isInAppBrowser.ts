// for checking user agent for in-app browser
export function isInAppBrowser() {
    if (typeof navigator === "undefined") return false;

    return /FBAN|FBAV|Instagram|Threads|LinkedIn|Twitter|Line|WeChat/i.test(
        navigator.userAgent
    );
}

export function openInExternalBrowser(path: string = "/signin") {
  if (typeof window === "undefined") return;

  const url = `${window.location.origin}${path}`;
  const ua = navigator.userAgent;

  // 👉 Android (force Chrome via intent)
  if (/Android/i.test(ua)) {
    window.location.href =
      `intent://${url.replace(/^https?:\/\//, "")}` +
      `#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }

  // 👉 iOS (Safari)
  window.open(url, "_blank");
}
