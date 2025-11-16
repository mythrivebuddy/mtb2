"use client";

import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

// -----------------------------
// 1) REACT BLOCK COMPONENT
// -----------------------------
// This is the interactive React component that will be mounted inside the editor.
// It receives `node`, `updateAttributes`, and `editor` props from Tiptap.

export type CalloutAttrs = {
  title?: string;
  body?: string;
  tone?: "info" | "warning" | "success";
};

export function CalloutBox({ node, updateAttributes }: any) {
  const attrs: CalloutAttrs = node.attrs || {};

  return (
    <div className="p-3 rounded-md border" style={{ background: "#f8fafc" }}>
      <div className="flex items-center justify-between gap-2">
        <input
          value={attrs.title || ""}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          placeholder="Callout title"
          className="font-semibold text-sm outline-none bg-transparent"
        />
        <select
          value={attrs.tone || "info"}
          onChange={(e) => updateAttributes({ tone: e.target.value })}
          className="text-xs"
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="success">Success</option>
        </select>
      </div>

      <textarea
        value={attrs.body || ""}
        onChange={(e) => updateAttributes({ body: e.target.value })}
        placeholder="Callout body..."
        className="w-full mt-2 resize-y p-2 rounded bg-white border"
        rows={3}
      />

      <div className="mt-2 text-xs text-gray-500">This is a React-powered block — fully interactive.</div>
    </div>
  );
}

// -----------------------------
// 2) TIPTAP NODE (uses ReactNodeViewRenderer)
// -----------------------------

const ReactCalloutNode = Node.create({
  name: "react_callout",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      title: { default: "" },
      body: { default: "" },
      tone: { default: "info" },
    };
  },

  parseHTML() {
    return [{ tag: "react-callout" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["react-callout", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBox as any);
  },
});

export default ReactCalloutNode;

// -----------------------------
// 3) HELPER: add to editor and insert button
// -----------------------------

export function useInsertCalloutButton(editor: Editor | null) {
  const insert = React.useCallback(() => {
    if (!editor) return;

    editor.chain().focus().insertContent({
      type: "react_callout",
      attrs: { title: "New callout", body: "Write here...", tone: "info" },
    }).run();
  }, [editor]);

  return { insert };
}

// Small helper UI component you can drop into your toolbar — it expects Tiptap `editor` instance.
export function InsertCalloutButton({ editor }: { editor: Editor | null }) {
  const { insert } = useInsertCalloutButton(editor);
  return (
    <button
      type="button"
      onClick={insert}
      className="px-2 py-1 rounded border text-sm"
    >
      Insert Callout
    </button>
  );
}

// -----------------------------
// 4) USAGE EXAMPLE (copy into your page)
// -----------------------------
// import ReactCalloutNode, { InsertCalloutButton } from './TiptapReactComponents'
//
// const editor = useEditor({
//   extensions: [StarterKit, ReactCalloutNode, /* other extensions */],
//   content: '',
// })
//
// <div className="toolbar">
//   <InsertCalloutButton editor={editor} />
// </div>
// <EditorContent editor={editor} />

// -----------------------------
// 5) Notes
// -----------------------------
// • The Node is `atom: true` which keeps it isolated (single block) and prevents schema conflicts.
// • The ReactNodeViewRenderer mounts the React component and keeps attributes in sync.
// • You can create as many React block components as you like — follow the same pattern.
// • When serialised, the callout will be part of editor.getJSON() and persist through save/load.
