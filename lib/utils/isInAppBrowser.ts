export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  
  // vendor is important for older iOS WebViews
  const ua = navigator.userAgent || navigator.vendor 

  // This list is now much more robust for Meta's ecosystem
  return /FBAN|FBAV|Instagram|Threads|LinkedIn|Twitter|Line|WeChat|FB_IAB|FB4A|FBSS|Messenger/i.test(ua);
}

export function openInExternalBrowser(path: string = "/signin") {
  if (typeof window === "undefined") return;

  const url = `${window.location.origin}${path}`;
  const ua = navigator.userAgent;

  // 👉 ANDROID: The Intent Strategy
  if (/Android/i.test(ua)) {
    const androidIntent = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
    
    // Some Threads versions block .href assignments to intent://
    // This attempt logic is the safest:
    try {
      window.location.href = androidIntent;
    } catch (e) {
      // Fallback: If blocked, try to force a normal location change 
      // though Google might still show the 403 error here.
      window.location.assign(url);
    }
    return;
  }

  // 👉 iOS: The "New Tab" Strategy
  // Threads on iOS is very stubborn. window.location.assign often keeps it 
  // inside Threads. window.open(url, '_blank') is more likely to trigger Safari.
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const newWindow = window.open(url, '_blank');
    
    // If the browser blocked the popup, fallback to redirect
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = url;
    }
    return;
  }

  // Desktop/Other
  window.location.assign(url);
}