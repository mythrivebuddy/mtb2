"use client";
import DOMPurify from "dompurify";

export default function ChallengeDescription({ html }: { html: string }) {
  // Clean the stored HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(html);

  return (
    <div
      className="prose prose-slate max-w-none"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
