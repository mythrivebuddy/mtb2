"use client";
import DOMPurify from "dompurify";

export default function ChallengeDescription({ html }: { html: string }) {
  // Clean the stored HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(html);

  return (
    <div
    className="prose prose-slate dark:prose-invert max-w-none text-md"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
