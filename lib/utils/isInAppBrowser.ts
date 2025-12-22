// for checking user agent for in-app browser
export function isInAppBrowser() {
    if (typeof navigator === "undefined") return false;

    return /FBAN|FBAV|Instagram|Threads|LinkedIn|Twitter|Line|WeChat/i.test(
        navigator.userAgent
    );
}
