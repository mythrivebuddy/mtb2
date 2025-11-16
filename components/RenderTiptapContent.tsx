"use client";

import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

// 1. Use the NAMED import, as your error message correctly suggested
import { TextStyle } from "@tiptap/extension-text-style";

/**
 * TipTap Renderer for public pages
 * Renders read-only TipTap JSON content
 */
export default function RenderTiptapContent({ content }: any) {
  const editor = useEditor({
    editable: false, // IMPORTANT → Read-only for viewers
    immediatelyRender: false,
    content,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      
      }),
      Underline,
      Link.configure({
        openOnClick: true,
      }),

      // 2. Extend the Image extension to accept 'width'
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              renderHTML: (attributes) => ({
                width: attributes.width,
              }),
            },
          };
        },
      }).configure({
        inline: false,
        allowBase64: true,
      }),
      
      // 3. Add the correctly imported TextStyle
      TextStyle,
    ],
  });

  return (
    <div className="prose prose-lg max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}