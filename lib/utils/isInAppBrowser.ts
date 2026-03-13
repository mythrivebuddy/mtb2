export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  
  // vendor is important for older iOS WebViews
  const ua = navigator.userAgent || navigator.vendor 

  
  return /FBAN|FBAV|Instagram|Threads|LinkedInApp|LinkedIn|Twitter|Line|WeChat|FB_IAB|FB4A|FBSS|Messenger/i.test(ua);
}

export function openInExternalBrowser(path: string) {
  const url = `${window.location.origin}${path}`;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
