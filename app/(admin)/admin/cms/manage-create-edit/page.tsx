  "use client";

  import React, { useEffect, useState } from "react";
  import dynamic from "next/dynamic";
  import { useSearchParams, useRouter } from "next/navigation";
  import { useForm, Controller } from "react-hook-form";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import axios from "axios";
  import { toast } from "sonner";
  import Link from "next/link";

  import { useEditor, EditorContent } from "@tiptap/react";
  import StarterKit from "@tiptap/starter-kit";
  import Underline from "@tiptap/extension-underline";
  import Youtube from "@tiptap/extension-youtube";
  // import Image from "@tiptap/extension-image";


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
import {TextStyle} from "@tiptap/extension-text-style";
import FontSize from "../_components/Fontsize";
import ReactCalloutNode, {
  // InsertCalloutButton,
} from "../_components/TiptapReactComponents.tsx"


  import { ArrowLeft, Save, Send, ChevronRight, ChevronLeft } from "lucide-react";

  const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
  });

  /* ===========================
    Enhanced Image (resizable)
    =========================== */
  import { Node, mergeAttributes } from "@tiptap/core";
  import { ArticleSchemaForm } from "../_components/schemaForms/ArticleSchemaForm";
  import { HowToSchemaForm } from "../_components/schemaForms/HowToSchemaForm";
  import { FaqSchemaForm } from "../_components/schemaForms/FaqSchemaForm";
  import { generateArticleSchema, generateFAQSchema, generateHowToSchema } from "../_components/schemaGenerators";

 /* ===========================
   Improved RESIZABLE Image Node
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
      uploading: { default: false },
      tempId: { default: null }
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]", // <-- CORRECT
      },
    ];
  },


  renderHTML({ HTMLAttributes }) {
    const { uploading, width, tempId, ...rest } = HTMLAttributes;

    return [
      "div",
      {
        class: "tiptap-image-wrapper",
        style: `width:${width};position:relative;display:inline-block;`,
        "data-uploading": uploading ? "true" : "false",
        "data-temp-id": tempId || undefined,
      },
      [
        "img",
        mergeAttributes(
          {
            class: "tiptap-image",
            style: "display:block;width:100%;border-radius:8px;",
          },
          rest
        ),
      ],

      uploading ? ["div", { class: "tiptap-image-skeleton" }] : "",

      !uploading
        ? [
            "div",
            {
              class: "resize-handle",
              contenteditable: "false",
              style:
                "width:12px;height:12px;position:absolute;right:-6px;bottom:-6px;background:#999;border-radius:50%;cursor:se-resize;",
            },
          ]
        : "",
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "tiptap-image-wrapper";
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.width = node.attrs.width || "100%";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.style.width = "100%";
      img.style.borderRadius = "8px";
      wrapper.appendChild(img);

      // --- Upload Skeleton ---
      if (node.attrs.uploading) {
        const skeleton = document.createElement("div");
        skeleton.className = "tiptap-image-skeleton";
        skeleton.style.cssText =
          "position:absolute;inset:0;background:#e5e7eb;opacity:.6;border-radius:8px;";
        wrapper.appendChild(skeleton);
      }

      // --- Resize Handle ---
      const handle = document.createElement("div");
      handle.className = "resize-handle";
      handle.style.cssText =
        "width:12px;height:12px;position:absolute;right:-6px;bottom:-6px;background:#999;border-radius:50%;cursor:se-resize;";
      wrapper.appendChild(handle);

      // SKIP resizing while uploading
      if (!node.attrs.uploading) {
        handle.addEventListener("mousedown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startWidth = wrapper.getBoundingClientRect().width;

  let lastUpdate = 0; // throttle marker

  const onMove = (ev: MouseEvent) => {
    const delta = ev.clientX - startX;
    const newWidth = Math.max(60, startWidth + delta);

    wrapper.style.width = `${newWidth}px`;

    const now = Date.now();
    if (now - lastUpdate < 60) return; // throttle 60ms updates
    lastUpdate = now;

    const pos = getPos();
    if (typeof pos !== "number") return;

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        width: `${newWidth}px`,
      });
      return true;
    });
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});

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
    content?: any;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    schemaType?: string;
    schemaMarkup?: any;
    isPublished: boolean;
  };

  type FormValues = {
    title: string;
    slug: string;
    content: any;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    schemaType: string;
    isPublished: boolean;
  };

  /* ===========================
    Component
    =========================== */
  export default function ManageCreateEditPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const isEdit = Boolean(id);

    const [step, setStep] = useState(1);
    const [schemaText, setSchemaText] = useState("");
    const [schemaPreview, setSchemaPreview] = useState<any>(null);

    const [isSlugEdited, setIsSlugEdited] = useState(false);
    // ... right after const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

    const [faqItems, setFaqItems] = useState([{ question: "", answer: "" }]);
  const [howToSteps, setHowToSteps] = useState([
    { title: "", description: "" },
  ]);
  const [articleData, setArticleData] = useState({
    headline: "",
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

    const createPage = useMutation({
      mutationFn: async (payload: any) => {
        const res = await axios.post("/api/admin/cms", payload);
        return res.data;
      },
      onSuccess: (data) => {
        toast.success("Page created successfully!");
        queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
        router.push(`/admin/cms/manage-create-edit?id=${data.id}`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Failed to create page");
      },
    });

    const updatePage = useMutation({
      mutationFn: async ({ id, payload }: any) => {
        const res = await axios.put(`/api/admin/cms/${id}`, payload);
        return res.data;
      },
      onSuccess: (data) => {
        toast.success(data.isPublished ? "Page published!" : "Draft saved!");
        queryClient.invalidateQueries({ queryKey: ["cms-page", id] });
        queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      },
      onError: (err: any) => {
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
          content: { type: "doc", content: [] },
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          canonicalUrl: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
          schemaType: "NONE",
          isPublished: false,
        },
      });

    const title = watch("title");

    useEffect(() => {
      if (!isSlugEdited) {
        setValue("slug", slugify(title));
      }
    }, [title]);

    /* ========== Editor ========== */
  const editor = useEditor({
  extensions: [
      StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
     
    }),
    //  Image.extend({ name: "image" }).configure({}),
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
    Youtube,
        ReactCalloutNode,
  ],
    editorProps: {
    handleDOMEvents: {
      keydown: (_view, event) => {
        // IMPORTANT: Let Tiptap handle keyboard logic
        return false;
      },
    },
  },
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

        setTimeout(() => {
          editor?.commands.setContent(p.content ?? { type: "doc", content: [] });
        }, 50);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageQuery.data, isEdit, reset]);

    /* ========== Image upload with base64 preview + skeleton + replace ========== */

    const genTempId = () =>
      `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      const tempId = genTempId();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64 = String(reader.result ?? "");

        // Insert temporary image node
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: { src: base64, uploading: true, tempId, width: "100%" },
          })
          .run();

        // Upload
        try {
          const url = await uploadImageToApi(file);

          // Replace all nodes with matching tempId
          const { state, view } = editor!;
          const tr = state.tr;
          state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs?.tempId === tempId) {
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
        } catch (err: any) {
          // Remove temp nodes with this tempId
          const { state, view } = editor!;
          const tr = state.tr;
          const toDelete: number[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs?.tempId === tempId) {
              toDelete.push(pos);
            }
            return true;
          });
          // delete in reverse order so positions stay valid
          toDelete
            .reverse()
            .forEach((pos) =>
              tr.delete(pos, pos + state.doc.nodeAt(pos)!.nodeSize)
            );
          if (tr.docChanged) view.dispatch(tr);
          toast.error(err?.message || "Upload failed");
        } finally {
          // reset input so same file can be selected again
          e.currentTarget.value = "";
        }
      };
    };

    /* ========== YouTube insert ========== */
    const insertYouTube = () => {
      const input = prompt("Enter YouTube URL or ID:");
      if (!input) return;
      const id = input.includes("http")
        ? input.split("v=")[1] || input.split("/").pop()
        : input;
      editor
        ?.chain()
        .focus()
        .insertContent(
          `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`
        )
        .run();
      toast.success("YouTube video added!");
    };

    /* ========== Save handlers ========== */
    const handleSave = async (values: FormValues, publishState: boolean) => {
      if (publishState) {
      setIsPublishing(true);
    } else {
      setIsSavingDraft(true);
    }
      let schemaMarkup = null;
      try {
        schemaMarkup = schemaText ? JSON.parse(schemaText) : null;
      } catch {
        toast.error("Invalid Schema JSON!");
        return;
      }

      const payload = {
        ...values,
        isPublished: publishState,
        schemaMarkup,
        content: editor?.getJSON(),
      };

      if (isEdit && id) {
        await updatePage.mutateAsync({ id, payload });
      } else {
        await createPage.mutateAsync(payload);
      }
      setIsSavingDraft(false);
      setIsPublishing(false);
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
    let json: any = null;

    if (watch("schemaType") === "FAQ_PAGE") {
      json = generateFAQSchema(faqItems);
    }

    if (watch("schemaType") === "HOW_TO") {
      json = generateHowToSchema(howToSteps);
    }

    if (watch("schemaType") === "ARTICLE") {
      json = generateArticleSchema(articleData);
    }

    // Only auto-generate for these 3 types
    if (json && watch("schemaType") !== "CUSTOM_JSON") {
      setSchemaText(JSON.stringify(json, null, 2));
    }
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
                      setIsSlugEdited(true); // STOP auto generation
                      setValue("slug", slugify(e.target.value));
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">{`https://mythrivebuddy.com/${watch("slug") || "<slug>"}`}</p>
                </div>

                <div>
                  <Label>Content Editor</Label>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                    >
                      Bold
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                    >
                      Italic
                    </Button>
                      {/* <InsertCalloutButton editor={editor} /> */}
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleUnderline().run()
                      }
                    >
                      Underline
                    </Button>

                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <Button size="sm" variant="outline" asChild>
                        <span>Insert Image</span>
                      </Button>
                    </label>

                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={insertYouTube}
                    >
                      YouTube
                    </Button>
{/* <Select
  onValueChange={(value) => {
    // 'value' comes as a string from the Select; convert and assert to the Heading level union
    const level = Number(value) as 1 | 2 | 3 | 4 | 5 | 6;
    editor?.chain().focus().setHeading({ level }).run();
  }}
>
  <SelectTrigger className="w-28">
    <SelectValue placeholder="Heading" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">H1</SelectItem>
    <SelectItem value="2">H2</SelectItem>
    <SelectItem value="3">H3</SelectItem>
    <SelectItem value="4">H4</SelectItem>
    <SelectItem value="5">H5</SelectItem>
    <SelectItem value="6">H6</SelectItem>
  </SelectContent>
</Select> */}

<Button
  size="sm"
  variant="outline"
  type="button"
  onClick={() => editor?.chain().focus().setParagraph().run()}
>
  Paragraph
</Button>
<Button
  size="sm"
  variant="outline"
  type="button"
  onClick={() => editor?.chain().focus().toggleBulletList().run()}
>
  Bullet List
</Button>
<Button
  size="sm"
  variant="outline"
  type="button"
  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
>
  Ordered List
</Button>
<Select
  onValueChange={(value) =>
    editor?.chain().focus().setFontSize(value).run()
  }
>
  <SelectTrigger className="w-32">
    <SelectValue placeholder="Font Size" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="12px">12px</SelectItem>
    <SelectItem value="14px">14px</SelectItem>
    <SelectItem value="16px">16px</SelectItem>
    <SelectItem value="18px">18px</SelectItem>
    <SelectItem value="20px">20px</SelectItem>
    <SelectItem value="24px">24px</SelectItem>
    <SelectItem value="28px">28px</SelectItem>
    <SelectItem value="32px">32px</SelectItem>
  </SelectContent>
</Select>

                  </div>

                  <div className="mt-3 border rounded-md p-3 min-h-[400px]">
                    <EditorContent editor={editor} />
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
                  <div>
                    <Label>Social Image URL (og:image)</Label>
                    <Input
                      {...register("ogImage")}
                      placeholder="https://.../image.png"
                    />
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
    <HowToSchemaForm steps={howToSteps} setSteps={setHowToSteps} />
  )}

  {watch("schemaType") === "ARTICLE" && (
    <ArticleSchemaForm data={articleData} setData={setArticleData} />
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
                    <Save size={16} /> {isSavingDraft ? "Saving..." : "Save Draft"}
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
