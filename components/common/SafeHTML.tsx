"use client";

import DOMPurify from "dompurify";

type SafeHTMLProps = {
  html: string | null | undefined;
  className?: string;
};

function sanitizeAndNormalize(html: string | null | undefined) {
  if (!html) return "";

  // 1. Decode safe entities only
  const decoded = html
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // 2. Sanitize (strict)
  let clean = DOMPurify.sanitize(decoded, {
    ALLOWED_TAGS: ["p", "strong", "em", "ul", "ol", "li", "br"],
  });

  // 3. Fix unicode spaces
  clean = clean.replace(/\u00A0/g, " ");

  // 4. Split into blocks
  const blocks = clean
    .split(/(<p>.*?<\/p>|<ul>.*?<\/ul>)/g)
    .filter(Boolean);

  let result = "";
  let listBuffer: string[] = [];

  for (const block of blocks) {
    const match = block.match(/<p>\s*[\*\-\u2022]\s+([\s\S]*?)<\/p>/);

    if (match) {
      listBuffer.push(match[1].trim());
    } else {
      if (listBuffer.length > 0) {
        result += `<ul>${listBuffer
          .map((item) => `<li>${item}</li>`)
          .join("")}</ul>`;
        listBuffer = [];
      }
      result += block;
    }
  }

  if (listBuffer.length > 0) {
    result += `<ul>${listBuffer
      .map((item) => `<li>${item}</li>`)
      .join("")}</ul>`;
  }

  clean = result;

  // 5. Replace empty paragraphs with spacing
  clean = clean.replace(/<p>(\s|&nbsp;)*<\/p>/g, "<br/>");

  return clean.trim();
}

export default function SafeHTML({ html, className = "" }: SafeHTMLProps) {
  const content = sanitizeAndNormalize(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}