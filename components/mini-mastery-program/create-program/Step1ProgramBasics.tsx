"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronDown, ArrowRight, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { step1MMPSchema, type Step1Data, type FullFormData } from "@/schema/zodSchema";
import { MMP_STORAGE_KEY } from "@/types/client/mini-mastery-program";

const BUCKET      = "mini-mastery-program";
const FOLDER      = "thumbnail-image";
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Extract storage path from a full Supabase public URL
// e.g. "https://xxx.supabase.co/storage/v1/object/public/mini-mastery-program/thumbnail-image/abc.jpg"
//   → "thumbnail-image/abc.jpg"
function extractFilePath(publicUrl: string): string | null {
  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.slice(idx + marker.length);
  } catch {
    return null;
  }
}

// Fire-and-forget delete via proxy — errors are non-fatal
async function deleteOldFile(filePath: string) {
  try {
    await fetch("/api/mini-mastery-programs/upload-thumbnail-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    });
  } catch {
    // non-fatal — old file stays in bucket, not a blocker
  }
}

interface Props {
  onNext: (data: Step1Data) => void;
  defaultValues?: Partial<Step1Data>;
}

export default function Step1ProgramBasics({ onNext, defaultValues }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(defaultValues?.thumbnailUrl ?? null);
  // Track the Supabase file path so we can delete the old one on replace/remove
  const uploadedFilePathRef = useRef<string | null>(
    defaultValues?.thumbnailUrl
      ? extractFilePath(defaultValues.thumbnailUrl)
      : null
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1MMPSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      duration: defaultValues?.duration || "7 Days",
      unlockType: "daily",
      thumbnailUrl: "",
      ...defaultValues,
    },
  });

  // useWatch triggers re-render + gives stable reference — no JSON.stringify hack needed
  const allValues = useWatch({ control });
  const unlockType = allValues.unlockType;

  // Persist to shared localStorage whenever form values change
  const persistToStorage = (values: Partial<Step1Data>) => {
    const stored = localStorage.getItem(MMP_STORAGE_KEY);
    const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
    localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step1: values }));
  };

  // RHF register onChange wrapper to also persist
  const registerWithPersist = (name: keyof Step1Data) => ({
    ...register(name, {
      onChange: () => persistToStorage(allValues as Partial<Step1Data>),
    }),
  });

  // ── Supabase image upload ──────────────────────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploadError(null);
    setUploadState("uploading");
    setPreviewUrl(URL.createObjectURL(file)); // instant local preview

    // Delete previous upload (fire-and-forget — non-blocking)
    if (uploadedFilePathRef.current) {
      void deleteOldFile(uploadedFilePathRef.current);
      uploadedFilePathRef.current = null;
    }

    try {
      const ext      = file.name.split(".").pop() ?? "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      // const filePath = `${FOLDER}/${fileName}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", FOLDER);

      const res = await fetch("/api/mini-mastery-programs/upload-thumbnail-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(json.message ?? "Upload failed.");
      }
      const { url } = await res.json() as { url: string };

      // Track the path for future deletion
      uploadedFilePathRef.current = extractFilePath(url) ?? `${FOLDER}/${fileName}`;

      setValue("thumbnailUrl", url, { shouldValidate: true });
      persistToStorage({ ...allValues, thumbnailUrl: url } as Partial<Step1Data>);
      setUploadState("success");
    } catch (err) {
      setUploadState("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setPreviewUrl(null);
      setValue("thumbnailUrl", "");
    }

    e.target.value = "";
  };

  const handleRemoveImage = () => {
    // Delete from Supabase (fire-and-forget)
    if (uploadedFilePathRef.current) {
      void deleteOldFile(uploadedFilePathRef.current);
      uploadedFilePathRef.current = null;
    }
    setPreviewUrl(null);
    setUploadState("idle");
    setUploadError(null);
    setValue("thumbnailUrl", "", { shouldValidate: false });
    persistToStorage({ ...allValues, thumbnailUrl: "" } as Partial<Step1Data>);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8" noValidate>
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Program Basics</h2>
        <p className="text-gray-400 mt-2">Define the core foundations of your Mini-Mastery program.</p>
      </header>

      <div className="space-y-6">
        {/* Program Title */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Program Title</label>
          <input
            {...registerWithPersist("title")}
            type="text"
            placeholder="e.g. 7-Day Mindful Morning Rituals"
            className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all placeholder:text-gray-300 ${
              errors.title
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-gray-100 focus:ring-blue-500"
            }`}
          />
          {errors.title ? (
            <p className="text-[11px] text-red-500 font-medium">{errors.title.message}</p>
          ) : (
            <p className="text-[11px] text-gray-400">A catchy name that grabs attention.</p>
          )}
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Subtitle / Transformation Promise</label>
          <textarea
            {...registerWithPersist("subtitle")}
            rows={3}
            placeholder="e.g. Master your focus and energy in just 10 minutes a day to achieve peak productivity."
            className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all placeholder:text-gray-300 resize-none ${
              errors.subtitle
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-gray-100 focus:ring-blue-500"
            }`}
          />
          {errors.subtitle ? (
            <p className="text-[11px] text-red-500 font-medium">{errors.subtitle.message}</p>
          ) : (
            <p className="text-[11px] text-gray-400">Describe the ultimate benefit users will experience.</p>
          )}
        </div>

        {/* Thumbnail Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            Program Thumbnail
            <span className="ml-2 text-[11px] font-normal text-gray-400">Optional</span>
          </label>

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />

          {previewUrl ? (
            /* ── Preview state ── */
            <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden border border-gray-100 group">
              <img src={previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />

              {/* Hover overlay with Change / Remove */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadState === "uploading"}
                  className="bg-white text-gray-900 font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload size={13} /> Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploadState === "uploading"}
                  className="bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-red-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X size={13} /> Remove
                </button>
              </div>

              {/* Uploading spinner */}
              {uploadState === "uploading" && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-blue-600" />
                </div>
              )}
            </div>
          ) : (
            /* ── Upload dropzone ── */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === "uploading"}
              className={`w-full aspect-[16/7] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${
                uploadState === "uploading"
                  ? "border-blue-200 bg-blue-50/30 cursor-not-allowed"
                  : "border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"
              }`}
            >
              {uploadState === "uploading" ? (
                <>
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <p className="text-xs font-bold text-blue-500">Uploading to Supabase...</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <ImageIcon size={20} className="text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">Click to upload thumbnail</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG or WebP · Max {MAX_SIZE_MB}MB</p>
                  </div>
                </>
              )}
            </button>
          )}

          {uploadError && <p className="text-[11px] text-red-500 font-medium">{uploadError}</p>}
          {errors.thumbnailUrl && <p className="text-[11px] text-red-500 font-medium">{errors.thumbnailUrl.message}</p>}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Duration</label>
          <div className="relative">
            <select
              {...registerWithPersist("duration")}
              className={`w-full p-4 bg-gray-50 border rounded-xl appearance-none outline-none focus:ring-2 text-gray-600 ${
                errors.duration
                  ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                  : "border-gray-100 focus:ring-blue-500"
              }`}
            >
              <option>7 Days</option>
              <option>11 Days</option>
              <option>14 Days</option>
              <option>21 Days</option>
              <option>30 Days</option>
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={20}
            />
          </div>
          {errors.duration && (
            <p className="text-[11px] text-red-500 font-medium">{errors.duration.message}</p>
          )}
        </div>

        {/* Unlock Type */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700">Unlock Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["daily", "all"] as const).map((type) => (
              <div
                key={type}
                onClick={() => {
                  setValue("unlockType", type, { shouldValidate: true });
                  persistToStorage({ ...allValues, unlockType: type } as Partial<Step1Data>);
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-start ${
                  unlockType === type
                    ? "border-blue-500 bg-white shadow-sm"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {type === "daily" ? "Daily unlock" : "All unlocked at once"}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    {type === "daily"
                      ? "New content appears every 24 hours to keep pace."
                      : "Users can binge the whole program immediately."}
                  </p>
                </div>
                {unlockType === type && (
                  <CheckCircle2 className="text-blue-500 fill-blue-50 shrink-0" size={20} />
                )}
              </div>
            ))}
          </div>
          {errors.unlockType && (
            <p className="text-[11px] text-red-500 font-medium">{errors.unlockType.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={uploadState === "uploading"}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-10 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          Save & Continue <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
}