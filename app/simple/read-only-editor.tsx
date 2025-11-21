"use client";

import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import FontSize from "@/app/(admin)/admin/cms/_components/Fontsize";
import { ResizableImage } from "@/app/(admin)/admin/cms/manage-create-edit/page"; // <-- adjust path

import "@/components/tiptap-templates/simple/simple-editor.scss";
import { ResponsiveYoutube } from "@/components/tiptap-templates/simple/ResponsiveYoutube";

export default function ReadOnlyTipTapEditor({ content }: { content: JSONContent }) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,

    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),

      // Important: same list schema as CMS editor
      TaskList,
      TaskItem.configure({ nested: true }),

      Highlight.configure({ multicolor: true }),

      // Your exact custom image node
      ResizableImage,

      // Must match toolbar features
      ResponsiveYoutube.configure({
        HTMLAttributes: { allowfullscreen: "true" },
      }),
      TextStyle,
      Underline,
      Superscript,
      Subscript,
      Typography,
      FontSize,
    ],

    content,
  });

  return (
   
  <div className="simple-editor-wrapper">
    <div className="simple-editor-content">
      <EditorContent editor={editor} className="tiptap ProseMirror simple-editor" />
    </div>
  </div>

  );
}
