import React from "react";

interface BlogContentProps {
  content: string;
}

const parseBlogContent = (content: string) => {
  // Split content into lines. You might split on "\n" for each line.
  const lines = content.split("\n");

  return lines.map((line, index) => {
    // Trim the line to remove extra spaces.
    const trimmed = line.trim();

    // Check if the line starts with a digit and a dot, e.g., "1. Some heading"
    const headingPattern = /^\d+\.\s+/;
    if (headingPattern.test(trimmed)) {
      // Render as a heading. You can choose h2, h3, etc. as needed.
      return (
        <h2 key={index} style={{ margin: "1rem 0", fontWeight: "bold" }}>
          {trimmed}
        </h2>
      );
    }

    // Otherwise, render it as a paragraph.
    return (
      <p key={index} style={{ margin: "0.5rem 0" }}>
        {trimmed}
      </p>
    );
  });
};

export default function BlogContent({ content }: BlogContentProps) {
  return <div>{parseBlogContent(content)}</div>;
}
