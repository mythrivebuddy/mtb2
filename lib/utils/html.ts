export function stripHtml(html: string | null | undefined, maxLength = 160) {
  if (!html) return "";

  let text = html;

  // decode recursively
  const decodeEntities = (str: string) => {
    let prev;
    do {
      prev = str;
      str = str
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&nbsp;/gi, " ");
    } while (str !== prev);
    return str;
  };

  text = decodeEntities(text);

  // remove tags
  text = text.replace(/<[^>]*>/g, " ");

  // remove bullets
  text = text.replace(/[\*\u2022]/g, " ");

  // normalize
  text = text.replace(/\s+/g, " ").trim();

  // 🚨 SAFE TRIM
  if (text.length > maxLength) {
    let trimmed = text.slice(0, maxLength);

    const lastSpace = trimmed.lastIndexOf(" ");

    // only trim to word if safe
    if (lastSpace > 0) {
      trimmed = trimmed.slice(0, lastSpace);
    }

    text = trimmed + "...";
  }

  return text;
}