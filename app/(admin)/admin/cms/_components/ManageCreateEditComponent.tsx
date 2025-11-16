// // 'use client';

// // import React, { useEffect, useState } from "react";
// // import dynamic from "next/dynamic";
// // import { useSearchParams, useRouter } from "next/navigation";
// // import { useForm, Controller } from "react-hook-form";
// // import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// // import axios from "axios";

// // import { useEditor, EditorContent } from "@tiptap/react";
// // import StarterKit from "@tiptap/starter-kit";
// // import ImageExtension from "@tiptap/extension-image";
// // import Underline from "@tiptap/extension-underline";
// // import Youtube from "@tiptap/extension-youtube";

// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Switch } from "@/components/ui/switch";
// // import {
// //   Select,
// //   SelectTrigger,
// //   SelectValue,
// //   SelectContent,
// //   SelectItem,
// // } from "@/components/ui/select";
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Separator } from "@/components/ui/separator";

// const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// /* ---------------------------------------------------- */
// /* Types */
// /* ---------------------------------------------------- */

// type Page = {
//   id: string;
//   title: string;
//   slug: string;
//   content: string;
//   metaTitle?: string | null;
//   metaDescription?: string | null;
//   metaKeywords?: string | null;
//   canonicalUrl?: string | null;
//   ogTitle?: string | null;
//   ogDescription?: string | null;
//   ogImage?: string | null;
//   schemaType?: string | null;
//   schemaMarkup?: any;
//   isPublished?: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// };

// type FormValues = {
//   title: string;
//   slug: string;
//   content: string;
//   metaTitle?: string;
//   metaDescription?: string;
//   metaKeywords?: string;
//   canonicalUrl?: string;
//   ogTitle?: string;
//   ogDescription?: string;
//   ogImage?: string;
//   schemaType: string;
//   schemaMarkup?: string;
//   isPublished: boolean;
// };

// type CreatePayload = Omit<FormValues, "schemaMarkup"> & { schemaMarkup?: any };
// type UpdateVariables = { id: string; payload: CreatePayload };


// const ManageCreateEditComponent = () => {

//       const router = useRouter();
//   const searchParams = useSearchParams();
//   const queryClient = useQueryClient();

//   const id = searchParams?.get("id") ?? null;
//   const isEdit = Boolean(id);

//   const [schemaPreview, setSchemaPreview] = useState<any | null>(null);

//   /* ---------------------------------------------------- */
//   /* Queries */
//   /* ---------------------------------------------------- */

//   const pageQuery = useQuery<Page>({
//     queryKey: ["cms-page", id],
//     enabled: !!id,
//     queryFn: async () => {
//       const res = await axios.get(`/api/admin/cms/${id}`);
//       return res.data as Page;
//     },
//   });

//   const pagesListQuery = useQuery<Page[]>({
//     queryKey: ["cms-pages"],
//     queryFn: async () => {
//       const res = await axios.get("/api/admin/cms");
//       return res.data as Page[];
//     },
//   });

//   /* ---------------------------------------------------- */
//   /* Mutations (properly typed) */
//   /* ---------------------------------------------------- */

//   const createPage = useMutation<Page, unknown, CreatePayload>({
//     mutationFn: async (payload: CreatePayload) => {
//       const res = await axios.post("/api/admin/cms", payload);
//       return res.data as Page;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
//       // data.id exists because server returns created Page
//       router.push(`/admin/cms/manage-create-edit?id=${data.id}`);
//     },
//   });

//   const updatePage = useMutation<Page, unknown, UpdateVariables>({
//     mutationFn: async ({ id: updateId, payload }: UpdateVariables) => {
//       const res = await axios.put(`/api/admin/cms/${updateId}`, payload);
//       return res.data as Page;
//     },
//     onSuccess: (_data, vars) => {
//       // vars is { id, payload }
//       queryClient.invalidateQueries({ queryKey: ["cms-page", vars.id] });
//     },
//   });

//   const deletePage = useMutation<void, unknown, string>({
//     mutationFn: async (deleteId: string) => {
//       await axios.delete(`/api/admin/cms/${deleteId}`);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
//       router.push("/admin/cms");
//     },
//   });

//   /* ---------------------------------------------------- */
//   /* Form (typed) */
//   /* ---------------------------------------------------- */

//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     watch,
//     setValue,
//     formState: { errors, isSubmitting },
//   } = useForm<FormValues>({
//     defaultValues: {
//       title: "",
//       slug: "",
//       content: "",
//       metaTitle: "",
//       metaDescription: "",
//       metaKeywords: "",
//       canonicalUrl: "",
//       ogTitle: "",
//       ogDescription: "",
//       ogImage: "",
//       schemaType: "NONE",
//       schemaMarkup: "",
//       isPublished: false,
//     },
//   });

//   const titleWatch = watch("title");

//   /* Auto-generate slug */
//   useEffect(() => {
//     const slug = watch("slug");
//     if (!slug && titleWatch) {
//       const generated = titleWatch
//         .toLowerCase()
//         .replace(/[^a-z0-9\s-]/g, "")
//         .trim()
//         .replace(/\s+/g, "-");
//       setValue("slug", generated);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [titleWatch]);

//   /* ---------------------------------------------------- */
//   /* TipTap Editor */
//   /* ---------------------------------------------------- */

//   const editor = useEditor({
//     extensions: [StarterKit, ImageExtension, Underline, Youtube],
//     content: "",
//     immediatelyRender: false,
//     onUpdate({ editor }) {
//       setValue("content", editor.getHTML());
//     },
//   }) as any;

//   /* ---------------------------------------------------- */
//   /* Populate form when editing (safe editor usage) */
//   /* ---------------------------------------------------- */

//   useEffect(() => {
//     if (!isEdit || !pageQuery.data) return;
//     const p = pageQuery.data;

//     reset({
//       title: p.title,
//       slug: p.slug,
//       content: p.content,
//       metaTitle: p.metaTitle || "",
//       metaDescription: p.metaDescription || "",
//       metaKeywords: p.metaKeywords || "",
//       canonicalUrl: p.canonicalUrl || "",
//       ogTitle: p.ogTitle || "",
//       ogDescription: p.ogDescription || "",
//       ogImage: p.ogImage || "",
//       schemaType: p.schemaType || "NONE",
//       schemaMarkup: p.schemaMarkup ? JSON.stringify(p.schemaMarkup, null, 2) : "",
//       isPublished: p.isPublished || false,
//     });

//     // set content only when editor is ready
//     if (editor) {
//       setTimeout(() => {
//         editor.commands?.setContent?.(p.content ?? "");
//       }, 100);
//     }
//   }, [isEdit, pageQuery.data, editor, reset]);

//   /* ---------------------------------------------------- */
//   /* Submit Handler (typed) */
//   /* ---------------------------------------------------- */

//   const onSubmit = async (values: FormValues) => {
//     let schemaMarkup = null;

//     try {
//       schemaMarkup = values.schemaMarkup ? JSON.parse(values.schemaMarkup) : null;
//     } catch {
//       alert("Invalid schema JSON");
//       return;
//     }

//     const payload: CreatePayload = {
//       ...values,
//       isPublished: !!values.isPublished,
//       schemaMarkup,
//     };

//     try {
//       if (isEdit && id) {
//         await updatePage.mutateAsync({ id, payload });
//         alert("Page updated!");
//       } else {
//         await createPage.mutateAsync(payload);
//       }
//     } catch {
//       alert("Error saving page.");
//     }
//   };

//   /* ---------------------------------------------------- */
//   /* File Uploads (typed) */
//   /* ---------------------------------------------------- */

//   const uploadImageToBackend = async (file: File): Promise<string> => {
//     const fd = new FormData();
//     fd.append("file", file);
//     const res = await axios.post("/api/admin/cms/upload", fd);
//     return res.data.url as string;
//   };

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       const url = await uploadImageToBackend(file);
//       editor?.chain().focus().setImage({ src: url }).run();
//       setValue("ogImage", url);
//     } catch (err) {
//       console.error(err);
//       alert("Image upload failed");
//     }
//   };

//   /* ---------------------------------------------------- */
//   /* YouTube Insert */
//   /* ---------------------------------------------------- */

//   const insertYouTube = () => {
//     const idOrUrl = prompt("YouTube URL or ID:");
//     if (!idOrUrl) return;

//     const id = idOrUrl.includes("http")
//       ? idOrUrl.split("v=")[1] || idOrUrl.split("/").pop()
//       : idOrUrl;

//     editor?.chain().focus().insertContent(`
//         <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>
//     `);
//   };

//   /* ---------------------------------------------------- */
//   /* Render */
//   /* ---------------------------------------------------- */

  
// }

// export default ManageCreateEditComponent
