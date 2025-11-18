/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

import { useEditor, EditorContent, EditorContext } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
// import Youtube from "@tiptap/extension-youtube";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { TextStyle } from "@tiptap/extension-text-style"; // Keep this
// import  {Color}  from "@tiptap/extension-color";
import FontSize from "../_components/Fontsize";
// import ReactCalloutNode from "../_components/TiptapReactComponents.tsx";

import { ArrowLeft, Save, Send, ChevronRight, ChevronLeft, YoutubeIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AxiosError } from "axios";


const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

/* ===========================
   Enhanced RESIZABLE Image Node
   =========================== */
import { Editor, JSONContent, Node, mergeAttributes } from "@tiptap/core";
import { ArticleSchemaForm } from "../_components/schemaForms/ArticleSchemaForm";
import { HowToSchemaForm } from "../_components/schemaForms/HowToSchemaForm";
import { FaqSchemaForm } from "../_components/schemaForms/FaqSchemaForm";
import {
  generateArticleSchema,
  generateFAQSchema,
  generateHowToSchema,
} from "../_components/schemaGenerators";
import type { Node as PMNode } from "prosemirror-model";

/* ===========================
   ResizableImage Node Definition
   =========================== */
export const ResizableImage = Node.create({

  name: "image",

  group: "block",

  draggable: true,

  atom: true,

  selectable: true,



  addAttributes() {

    return {

      src: { default: null },

      alt: { default: "" },

      width: { default: "100%" },

      uploading: { default: null },

      tempId: { default: null },

    };

  },



  parseHTML() {

    return [

      {

        tag: "img[src]",

      },

    ];

  },



  renderHTML({ HTMLAttributes }) {

    const { uploading, tempId, ...rest } = HTMLAttributes;



    // remove width from HTML

    delete rest.width;



    return [

      "div",

      {

        class: "tiptap-image-wrapper",

        style: "width:100%; position:relative; display:block;",

        "data-uploading": uploading ? "true" : "false",

        "data-temp-id": tempId || undefined,

      },

      [

        "img",

        mergeAttributes(

          {

            class: "tiptap-image",

            style: "display:block;width:100%;height:auto;border-radius:8px;",

          },

          rest

        ),

      ],



      uploading ? ["div", { class: "tiptap-image-skeleton" }] : "",

    ];

  },



  /* ⭐ NodeView WITHOUT RESIZE HANDLE */

  addNodeView() {

    return ({ node }) => {

      const wrapper = document.createElement("div");

      wrapper.className = "tiptap-image-wrapper";

      wrapper.style.position = "relative";

      wrapper.style.display = "block";

      wrapper.style.width = "100%";



      const img = document.createElement("img");

      img.src = node.attrs.src;

      img.alt = node.attrs.alt || "";

      img.style.width = "100%";

      img.style.height = "auto";

      img.style.borderRadius = "8px";

      wrapper.appendChild(img);



      // Skeleton while uploading

      if (node.attrs.uploading) {

        const skeleton = document.createElement("div");

        skeleton.className = "tiptap-image-skeleton";

        skeleton.style.cssText =

          "position:absolute;inset:0;background:#e5e7eb;opacity:.6;border-radius:8px;";

        wrapper.appendChild(skeleton);

      }



      return { dom: wrapper };

    };

  },

});



/* ===========================
   Helper: upload to API
   =========================== */
async function uploadImageToApi(file: File): Promise<string> {
  if (!file) throw new Error("No file provided");
  const fd = new FormData();
  fd.append("file", file);
  const res = await axios.post("/api/admin/cms/upload", fd);
  if (res.data?.url) return res.data.url;
  throw new Error(res.data?.error || "Upload failed");
}

/* ===========================
   Types
   =========================== */
  
type Page = {
  id: string;
  title: string;
  slug: string;
  content?:  JSONContent;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaType?: string;
  schemaMarkup?: SchemaMarkup;
  isPublished: boolean;
};

type FormValues = {
  title: string;
  slug: string;
  content: JSONContent;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaType: string;
  schemaMarkup?: SchemaMarkup;
  isPublished: boolean;
};
type UpdatePageArgs = {
  id: string;
  payload: FormValues;
};


/* ===========================
   SimpleEditorWrapper (adapted from template)
   - uses the toolbar/ui from the template package under components/tiptap-templates/simple
   - accepts external editor and uses handleImageUploadLocal for uploads
   =========================== */
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import { LinkPopover, LinkButton } from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import "@/components/tiptap-templates/simple/simple-editor.scss";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { ArticleFormData, ArticleSchema, FaqItem, FAQSchema, HowToSchema, HowToStepForm, SchemaMarkup } from "@/types/types";
import { ResponsiveYoutube } from "@/components/tiptap-templates/simple/ResponsiveYoutube";

/* Toolbar UI pieces (local) */

 const extractYouTubeID = (input: string): string | null => {
  if (!input || typeof input !== "string") return null;

  // strip HTML if user pasted an iframe/html blob
  const srcMatch = input.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) input = srcMatch[1];

  // Common YouTube URL patterns
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/, // watch?v= or embed/
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/, // youtu.be/
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/, // /v/
    /\/([A-Za-z0-9_-]{11})(?:\?|&|$)/, // fallback: 11-char id somewhere
  ];

  for (const r of regexes) {
    const m = input.match(r);
    if (m && m[1]) return m[1];
  }

  return null;
};

export function YouTubePopover({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeID(url) || (url.length === 11 ? url : null);

    if (!id) {
      toast.error("Invalid YouTube URL");
      return;
    }

    // This is the key difference: inserting a node instead of setting a mark
    editor.commands.insertContent({
      type: "youtube",
      attrs: { src: `https://www.youtube.com/embed/${id}` },
    });

    setIsOpen(false);
    setUrl("");
    toast.success("YouTube embedded");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button" className="gap-2">
          <YoutubeIcon className="h-4 w-4 text-red-600" />
          Add YouTube
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" side="top">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <h4 className="font-medium leading-none mb-1">Add YouTube Video</h4>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              className="h-8"
              autoFocus
            />
            <Button type="submit" size="sm" className="h-8">
              Add
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function MainToolbarContent({
  editor,
  onHighlighterClick,
  onLinkClick,
  isMobile,
  triggerFileInput,
  // youtubePrompt
}: {
  editor: Editor;
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
  triggerFileInput: () => void;
  // youtubePrompt: () => void;
}) {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button type="button" variant="outline" onClick={triggerFileInput}>
          Add Image
        </Button>
        <YouTubePopover editor={editor} />
      </ToolbarGroup>

      <Spacer />

      <ToolbarSeparator />

      <ToolbarGroup>{/* <ThemeToggle /> */}</ToolbarGroup>
    </>
  );
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? <div /> : <div />}
  </>
);

export function SimpleEditorWrapper({
  editor,
  handleImageUploadLocal,
}: {
  editor: Editor;
  handleImageUploadLocal: (file: File) => Promise<string>;
}) {
  const isMobile = useIsBreakpoint() && false;

  
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  );
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // const rect = useCursorVisibility({
  //   editor,
  //   overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  // });
  // console.log("isMobile", isMobile, "rect", rect);
  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerFileInput = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const tempId = `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = String(reader.result ?? "");
      editor
        ?.chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src: base64, uploading: true, tempId, width: "100%" },
        })
        .run();

      try {
        const url = await handleImageUploadLocal(file);
        const { state, view } = editor;
        const tr = state.tr;
        state.doc.descendants((node: PMNode, pos: number) => {
          const attrs = (node as unknown as { attrs?: Record<string, unknown> }).attrs;
          if (node.type.name === "image" && attrs?.tempId === tempId) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: url,
              uploading: false,
              tempId: null,
            });
          }
          return true;
        });
        if (tr.docChanged) view.dispatch(tr);
        toast.success("Image uploaded");
      } catch (err) {
        const { state, view } = editor;
        const tr = state.tr;
        const toDelete: number[] = [];
        state.doc.descendants((node: PMNode, pos: number) => {
          const attrs = (node as unknown as { attrs?: Record<string, unknown> }).attrs;
          if (node.type.name === "image" && attrs?.tempId === tempId) {
            toDelete.push(pos);
          }
          return true;
        });
        toDelete
          .reverse()
          .forEach((pos) =>
            tr.delete(pos, pos + state.doc.nodeAt(pos)!.nodeSize)
          );
        if (tr.docChanged) view.dispatch(tr);
        const message = (err as unknown as { message?: string })?.message ?? "Upload failed";
        toast.error(message);
      } finally {
        setFileInputKey((k) => k + 1);
      }
    };
  };

//   const insertYouTubeByPrompt = () => {
//   const input = prompt("YouTube URL or ID:");
//   if (!input || !editor) return;
//   const id = extractYouTubeID(input) || (input.length === 11 ? input : null);
//   if (!id) return toast.error("Couldn't parse YouTube ID");

//   editor.commands.insertContent({
//     type: "youtube",
//     attrs: { src: `https://www.youtube.com/embed/${id}` },
//   });

//   toast.success("YouTube embedded");
// };


  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar ref={toolbarRef} data-toolbar>
          {mobileView === "main" ? (
            <MainToolbarContent
            editor={editor}
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              triggerFileInput={triggerFileInput}
               // youtubePrompt={insertYouTubeByPrompt}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <input
          key={fileInputKey}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        <EditorContent editor={editor} className="simple-editor-content" />
      </EditorContext.Provider>
    </div>
  );
}

/* ===========================
   Main Component: ManageCreateEditPage
   =========================== */
export default function ManageCreateEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = Boolean(id);

  const [step, setStep] = useState(1);
  const [schemaText, setSchemaText] = useState("");
  const [schemaPreview, setSchemaPreview] = useState(null);

  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [faqItems, setFaqItems] = useState<FaqItem[]>([{ question: "", answer: "" }]);
  const [howToSteps, setHowToSteps] = useState<HowToStepForm[]>([
    { title: "", description: "" },
  ]);
  const [articleData, setArticleData] = useState<ArticleFormData>({
    headline: "",
    description:"",
    author: "",
    datePublished: "",
    image: "",
  });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const pageQuery = useQuery({
    queryKey: ["cms-page", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await axios.get(`/api/admin/cms/${id}`);
      return res.data as Page;
    },
  });

  const createPage = useMutation<Page, AxiosError<{ error: string }>, FormValues>({
    mutationFn: async (payload: FormValues) => {
      const res = await axios.post("/api/admin/cms", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Page created successfully!");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      router.push(`/admin/cms/manage-create-edit?id=${data.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to create page");
    },
  });

  const updatePage = useMutation<
  Page,
  AxiosError<{ error: string }>,
  UpdatePageArgs
>({
    mutationFn: async ({ id, payload }) => {
      const res = await axios.put(`/api/admin/cms/${id}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.isPublished ? "Page published!" : "Draft saved!");
      queryClient.invalidateQueries({ queryKey: ["cms-page", id] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to update page");
    },
  });  

  const deletePage = useMutation({
    mutationFn: async (deleteId: string) => {
      await axios.delete(`/api/admin/cms/${deleteId}`);
    },
    onSuccess: () => {
      toast.success("Page deleted!");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      router.push("/admin/cms");
    },
  });

  const { register, handleSubmit, reset, control, setValue, watch, trigger } =
    useForm<FormValues>({
      defaultValues: {
        title: "",
        slug: "",
        content: { type: "doc", content: [] } as JSONContent,
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        schemaType: "NONE",
        schemaMarkup: null,
        isPublished: false,
      },
    });

  const title = watch("title");

  useEffect(() => {
    if (!isSlugEdited) {
      setValue("slug", slugify(title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  /* ========== Editor ========== */
 

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),

      BulletList,
      OrderedList,
      ListItem,
      TextStyle,
      FontSize,
      Underline,
      ResizableImage,
     ResponsiveYoutube.configure({
            HTMLAttributes: { allowfullscreen: "true" },
          }),
      // ReactCalloutNode,
      // Color, // For the color popover
      TaskList, // For the task list button
      TaskItem.configure({
        // Required by TaskList
        nested: true,
      }),
      Superscript, // For the superscript button
      Subscript, // For the subscript button
      TextAlign.configure({
        // For the text-align buttons
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      handleDOMEvents: {
        mousedown: (_view, event) => {
          const el = event.target as HTMLElement;

          // Check if the click happened inside the toolbar
          if (el.closest("[data-toolbar]")) {
            // Prevent the default mousedown behavior (stealing focus)
            event.preventDefault();
            return true; // Stop processing the event
          }

          return false;
        },
      },
      handlePaste(view, event) {
      try {
        const clipboardData = (event as ClipboardEvent).clipboardData;
        if (!clipboardData) return false;

        // Prefer text/html (iframe paste), then fallback to plain text
        const html = clipboardData.getData("text/html");
        const text = clipboardData.getData("text/plain");

        const combined = (html && html.length > 0) ? html : text;
        const id = extractYouTubeID(combined);

        if (id) {
          // insert a youtube node and stop the default paste
          const { state, dispatch } = view;
          const pos = state.selection.from;

          const node = view.state.schema.nodes.youtube?.create({
            src: `https://www.youtube.com/embed/${id}`,
            // some youtube extensions prefer 'videoId' attr; include both if possible
            // videoId: id,
          });

          if (node) {
            const tr = state.tr.insert(pos, node);
            dispatch(tr.scrollIntoView());
            return true;
          }
        }
      } catch (err) {
        // swallow errors so paste doesn't break; return false to allow fallback
        // console.warn("youtube paste error", err);
        console.log(err);
      }

      // not a youtube paste -> let other handlers/process continue
      return false;
    },
    },
      // handlePaste will try to detect YouTube links in pasted text/html and convert them to a youtube node
    
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setValue("content", editor.getJSON());
    },
  });

  useEffect(() => {
    if (isEdit && pageQuery.data) {
      const p = pageQuery.data;
      reset({
        title: p.title,
        slug: p.slug,
        content: p.content ?? { type: "doc", content: [] },
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
        metaKeywords: p.metaKeywords || "",
        canonicalUrl: p.canonicalUrl || "",
        ogTitle: p.ogTitle || "",
        ogDescription: p.ogDescription || "",
        ogImage: p.ogImage || "",
        schemaType: p.schemaType || "NONE",
        isPublished: p.isPublished,
      });

      setSchemaText(
        p.schemaMarkup ? JSON.stringify(p.schemaMarkup, null, 2) : ""
      );

      // ⭐ Prefill FAQ items
      if (p.schemaType === "FAQ_PAGE" && "mainEntity" in (p.schemaMarkup ?? {})) {
         const faqSchema = p.schemaMarkup as FAQSchema;
        setFaqItems(
          faqSchema.mainEntity.map((item) => ({
            question: item.name || "",
            answer: item.acceptedAnswer?.text || "",
          }))
        );
      }

      // ⭐ Prefill HOW-TO steps
      if (p.schemaType === "HOW_TO" && "step" in (p.schemaMarkup ?? {})) {
        const howTo = p.schemaMarkup as HowToSchema;
        setHowToSteps(
          howTo.step.map((s) => ({
            title: s.name || "",
            description: s.text || "",
          }))
        );
      }

      // ⭐ Prefill ARTICLE schema data
      if (p.schemaType === "ARTICLE") {
        const article = p.schemaMarkup as ArticleSchema;
        setArticleData({
          headline: article.headline || "",
          description: article.description || "",
          author: article.author?.name || "",
          datePublished: article.datePublished || "",
          image: article.image || "",
        });
      }

      setTimeout(() => {
        editor?.commands.setContent(p.content ?? { type: "doc", content: [] });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageQuery.data, isEdit, reset,editor]);

  /* ========== Image upload with base64 preview + skeleton + replace ========== */

  // const genTempId = () =>
  //   `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  // const handleImageUpload = async (
  //   e: React.ChangeEvent<HTMLInputElement> | File | null
  // ) => {
  //   let file: File | undefined;
  //   if (!e) return;
  //   if (e instanceof File) {
  //     file = e;
  //   } else {
  //     file = e.target?.files?.[0];
  //   }
  //   if (!file) return;
  //   const reader = new FileReader();
  //   const tempId = genTempId();
  //   reader.readAsDataURL(file);

  //   reader.onload = async () => {
  //     const base64 = String(reader.result ?? "");

  //     // Insert temporary image node
  //     editor
  //       ?.chain()
  //       .focus()
  //       .insertContent({
  //         type: "image",
  //         attrs: { src: base64, uploading: true, tempId, width: "100%" },
  //       })
  //       .run();

  //     // Upload
  //     try {
  //       const url = await uploadImageToApi(file as File);

  //       // Replace all nodes with matching tempId
  //       const { state, view } = editor!;
  //       const tr = state.tr;
  //       state.doc.descendants((node, pos) => {
  //         if (node.type.name === "image" && node.attrs?.tempId === tempId) {
  //           tr.setNodeMarkup(pos, undefined, {
  //             ...node.attrs,
  //             src: url,
  //             uploading: false,
  //             tempId: null,
  //           });
  //         }
  //         return true;
  //       });
  //       if (tr.docChanged) view.dispatch(tr);

  //       toast.success("Image uploaded");
  //     } catch (err: any) {
  //       const { state, view } = editor!;
  //       const tr = state.tr;
  //       const toDelete: number[] = [];
  //       state.doc.descendants((node, pos) => {
  //         if (node.type.name === "image" && node.attrs?.tempId === tempId) {
  //           toDelete.push(pos);
  //         }
  //         return true;
  //       });
  //       toDelete
  //         .reverse()
  //         .forEach((pos) =>
  //           tr.delete(pos, pos + state.doc.nodeAt(pos)!.nodeSize)
  //         );
  //       if (tr.docChanged) view.dispatch(tr);
  //       toast.error(err?.message || "Upload failed");
  //     } finally {
  //       if (!(e instanceof File) && (e.target as HTMLInputElement)) {
  //         (e.target as HTMLInputElement).value = "";
  //       }
  //     }
  //   };
  // };

  /* ========== YouTube insert ========== */
  // const insertYouTube = () => {
  //   const input = prompt("Enter YouTube URL or ID:");
  //   if (!input) return;
  //   const id = input.includes("http")
  //     ? input.split("v=")[1] || input.split("/").pop()
  //     : input;
  //   editor
  //     ?.chain()
  //     .focus()
  //     .insertContent(
  //       `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`
  //     )
  //     .run();
  //   toast.success("YouTube video added!");
  // };

  /* ========== Save handlers ========== */
  const handleSave = async (values: FormValues, publishState: boolean) => {
    if (publishState) {
      setIsPublishing(true);
    } else {
      setIsSavingDraft(true);
    }
    let schemaMarkup = null;
    try {
      schemaMarkup = schemaText ? (JSON.parse(schemaText) as Record<string, unknown>) : null;
    } catch {
      toast.error("Invalid Schema JSON!");
      setIsSavingDraft(false);
      setIsPublishing(false);
      return;
    }

    const payload = {
      ...values,
      isPublished: publishState,
      schemaMarkup,
      content: editor?.getJSON() ?? { type: "doc", content: [] },
    };

    try {
      if (isEdit && id) {
        await updatePage.mutateAsync({ id, payload });
      } else {
        await createPage.mutateAsync(payload);
      }
    } finally {
      setIsSavingDraft(false);
      setIsPublishing(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await trigger(["title", "slug"]);
      if (!isValid) {
        toast.error("Please provide a Title and Slug to continue.");
        return;
      }
    }
    setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  const currentStatus = watch("isPublished") ? "Published" : "Draft";
  const stepTitles = [
    "Page Content",
    "SEO & Social",
    "AEO & Schema",
    "Review & Publish",
  ];

  useEffect(() => {
     const schemaType = watch("schemaType");
     let json: FAQSchema | HowToSchema | ArticleSchema | null = null;

    if (schemaType === "FAQ_PAGE") {
      json = generateFAQSchema(faqItems) as FAQSchema;
    }

    if (schemaType === "HOW_TO") {
      json = generateHowToSchema(howToSteps) as HowToSchema;
    }

    if (schemaType === "ARTICLE") {
      json = generateArticleSchema(articleData) as ArticleSchema;
    }

    if (json && schemaType !== "CUSTOM_JSON") {
      setSchemaText(JSON.stringify(json, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqItems, howToSteps, articleData, watch("schemaType")]);

  /* ========== Render ========== */
  return (
    <div className="p-6 max-w-6xl w-full flex flex-col gap-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/cms">CMS</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isEdit ? "Edit Page" : "Create Page"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-2xl font-semibold">
            {isEdit ? "Edit Page" : "Create Page"}
          </h1>
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push(`/admin/cms`)}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Pages</span>
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Step {step}: {stepTitles[step - 1]}
        </h2>
        <div className="text-sm text-muted-foreground">Page {step} of 4</div>
      </div>

      <form className="w-full">
        {/* Step 1 - Editor */}
        {step === 1 && (
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label>Title</Label>
                <Input {...register("title")} />
              </div>

              <div>
                <Label>Slug</Label>
                <Input
                  {...register("slug")}
                  onChange={(e) => {
                    setIsSlugEdited(true);
                    setValue("slug", slugify(e.target.value));
                  }}
                />
                <p className="text-sm text-muted-foreground mt-1">{`https://mythrivebuddy.com/${watch("slug") || "<slug>"}`}</p>
              </div>

              <div>
                <Label>Content Editor</Label>

                <div className="mt-3">
                  {!editor ? (
                    "Loading editor ........."
                  ) : (
                    <SimpleEditorWrapper
                      editor={editor}
                      handleImageUploadLocal={(file) => uploadImageToApi(file)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 - SEO */}
        {step === 2 && (
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Search Engine SEO</h3>
                <div>
                  <Label>Meta Title</Label>
                  <Input {...register("metaTitle")} />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea {...register("metaDescription")} rows={3} />
                </div>
                <div>
                  <Label>Meta Keywords (Optional)</Label>
                  <Input
                    {...register("metaKeywords")}
                    placeholder="e.g., solo, entrepreneur"
                  />
                </div>
                <div>
                  <Label>Canonical URL (Optional)</Label>
                  <Input
                    {...register("canonicalUrl")}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">
                  Social Sharing (Open Graph)
                </h3>
                <div>
                  <Label>Social Title (og:title)</Label>
                  <Input {...register("ogTitle")} />
                </div>
                <div>
                  <Label>Social Description (og:description)</Label>
                  <Textarea {...register("ogDescription")} rows={3} />
                </div>
                {/* OG IMAGE UPLOAD */}
                <div className="space-y-2">
                  <div className="h-40 w-40">
                    <Label>Social Image (og:image)</Label>

                    {/* Preview */}
                    {watch("ogImage") && (
                      <img
                        src={watch("ogImage")}
                        alt="og-image-preview"
                        className="w-full h-full object-contain rounded"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Input
                      {...register("ogImage")}
                      placeholder="https://.../image.png"
                      className="flex-1"
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        document.getElementById("ogUpload")?.click()
                      }
                    >
                      Upload
                    </Button>

                    <input
                      id="ogUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                          const fileInput = e.target as HTMLInputElement;
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          toast.info("Uploading image...");
                          const fd = new FormData();
                          fd.append("file", file);

                          const res = await axios.post(
                            "/api/admin/cms/upload",
                            fd
                          );
                          // toast.info("Wait uploading image ")
                          if (res.data?.url) {
                            setValue("ogImage", res.data.url);
                            toast.success("Image uploaded!");
                          } else {
                            toast.error("Upload failed!");
                          }
                        } catch (err) {
                          console.log(err);
                          toast.error("Upload error");
                        } finally {
      // 🔥 CRITICAL — reset the input so user can upload again
      fileInput.value = "";
    }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 - Schema */}
        {step === 3 && (
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4 p-4 border rounded-lg flex-1 flex flex-col">
                <h3 className="text-lg font-medium mb-4">AEO & Schema</h3>
                <div>
                  <Label>Schema Type</Label>
                  <Controller
                    name="schemaType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          <SelectItem value="ARTICLE">Article</SelectItem>
                          <SelectItem value="FAQ_PAGE">FAQ</SelectItem>
                          <SelectItem value="HOW_TO">How To</SelectItem>
                          <SelectItem value="CUSTOM_JSON">
                            Custom JSON
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {watch("schemaType") === "FAQ_PAGE" && (
                  <FaqSchemaForm items={faqItems} setItems={setFaqItems} />
                )}

                {watch("schemaType") === "HOW_TO" && (
                  <HowToSchemaForm
                    steps={howToSteps}
                    setSteps={setHowToSteps}
                  />
                )}

                {watch("schemaType") === "ARTICLE" && (
                  <ArticleSchemaForm
                    data={articleData}
                    setData={setArticleData}
                  />
                )}

                <div className="flex-1 flex flex-col mt-4">
                  <Label>Schema JSON-LD</Label>
                  <div className="mt-2 border rounded-md min-h-[400px] flex-1">
                    <MonacoEditor
                      defaultLanguage="json"
                      value={schemaText}
                      onChange={(v) => setSchemaText(v ?? "")}
                      height="400px"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(schemaText || "{}");
                          setSchemaPreview(parsed);
                          toast.success("Schema valid!");
                        } catch {
                          toast.error("Invalid JSON!");
                        }
                      }}
                    >
                      Preview
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setSchemaPreview(null);
                        setSchemaText("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  {schemaPreview && (
                    <pre className="mt-3 p-3 bg-gray-100 rounded text-sm max-h-[200px] overflow-auto">
                      {JSON.stringify(schemaPreview, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 - Publish */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review & Publish</CardTitle>
                {isEdit && (
                  <span
                    className={`font-medium text-sm px-3 py-1 rounded-full ${watch("isPublished") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    Status: {currentStatus}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>
                You're all set. You can save this page as a draft or publish it
                to make it live.
              </p>

              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  const slug = watch("slug");
                  if (!slug) return toast.error("Slug required to preview!");
                  window.open(`/${slug}`, "_blank");
                }}
              >
                Preview Public Page
              </Button>

              <Separator />

              <div className="flex justify-end gap-2">
                {isEdit && (
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this page?"))
                        deletePage.mutate(id!);
                    }}
                    disabled={deletePage.isPending}
                  >
                    Delete
                  </Button>
                )}

                <Button
                  variant="outline"
                  type="button"
                  onClick={handleSubmit((data) => handleSave(data, false))}
                  disabled={isSavingDraft || isPublishing}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />{" "}
                  {isSavingDraft ? "Saving..." : "Save Draft"}
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit((data) => handleSave(data, true))}
                  disabled={isPublishing || isSavingDraft}
                  className="flex items-center gap-2"
                >
                  <Send size={16} />{" "}
                  {isPublishing
                    ? "Publishing..."
                    : isEdit
                      ? "Update & Publish"
                      : "Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </Button>

        {step !== 4 && (
          <Button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-1"
          >
            Next <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
