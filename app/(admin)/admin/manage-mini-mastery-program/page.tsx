"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Filter, X, Eye, CheckCircle, XCircle,
  RefreshCw, ChevronLeft, ChevronRight, Loader2,
  BookOpen, AlertCircle, Upload, ImageIcon,
  Video, FileText, ChevronDown, ChevronUp, Pencil,
  BookOpenCheck, Calendar, DollarSign, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgramStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED";

interface Creator {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Program {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationDays: number | null;
  price: number | null;
  currency: string | null;
  modules: unknown;
  achievements: unknown;
  unlockType: string | null;
  completionThreshold: number | null;
  certificateTitle: string | null;
  status: string | null;
  isActive: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  creator: Creator | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  programs: Program[];
  pagination: Pagination;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIMIT = 10;

const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string }> = {
  PUBLISHED:    { label: "Published",    color: "bg-green-100 text-green-700" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-700"  },
  DRAFT:        { label: "Draft",        color: "bg-gray-100 text-gray-600"  },
};

function formatPrice(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "Free";
  return `${currency === "USD" ? "$" : "₹"}${price.toLocaleString()}`;
}

function moduleCount(modules: unknown): number {
  return Array.isArray(modules) ? modules.length : 0;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function convertToEmbedUrl(url: string): string {
  if (!url) return url;
  try {
    const p = new URL(url);
    if (p.pathname.includes("/embed/")) return url;
    if (p.hostname.includes("youtube.com")) {
      const v = p.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (p.hostname.includes("youtu.be")) {
      const v = p.pathname.replace("/", "");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    return url;
  } catch { return url; }
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchPrograms(page: number, status: string, search: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const { data } = await axios.get<ApiResponse>(`/api/admin/mini-mastery-programs?${params}`);
  return data;
}

async function patchStatus(id: string, status: ProgramStatus): Promise<void> {
  await axios.patch("/api/admin/mini-mastery-programs", { id, status });
}

async function createProgram(payload: object): Promise<void> {
  await axios.post("/api/admin/mini-mastery-programs/create", payload);
}

async function updateProgram(id: string, payload: object): Promise<void> {
  await axios.put("/api/admin/mini-mastery-programs/create", { id, ...payload });
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
              <div className="space-y-2">
                <div className="h-3.5 w-40 bg-gray-100 rounded" />
                <div className="h-2.5 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          </td>
          {[...Array(5)].map((_, j) => (
            <td key={j} className="px-4 py-4"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Image Upload Hook ────────────────────────────────────────────────────────

function useImageUpload() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const uploadedPathRef = useRef<string | null>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_MB = 5;

  function extractFilePath(publicUrl: string): string | null {
    try {
      const marker = `/object/public/mini-mastery-program/`;
      const idx = publicUrl.indexOf(marker);
      return idx === -1 ? null : publicUrl.slice(idx + marker.length);
    } catch { return null; }
  }

  async function deleteFile(filePath: string) {
    try {
      await fetch("/api/mini-mastery-programs/upload-thumbnail-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
    } catch { /* non-fatal */ }
  }

  async function handleFile(file: File): Promise<string | null> {
    if (!ALLOWED_TYPES.includes(file.type)) { setUploadError("Only JPG, PNG, or WebP allowed."); return null; }
    if (file.size > MAX_MB * 1024 * 1024)   { setUploadError(`Max ${MAX_MB}MB allowed.`);        return null; }
    if (uploadedPathRef.current) { void deleteFile(uploadedPathRef.current); uploadedPathRef.current = null; }
    setUploadError(null);
    setUploadState("uploading");
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "thumbnail-image");
      const res = await fetch("/api/mini-mastery-programs/upload-thumbnail-image", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(j.message ?? "Upload failed");
      }
      const { url } = await res.json() as { url: string };
      uploadedPathRef.current = extractFilePath(url);
      setUploadState("success");
      return url;
    } catch (err) {
      setUploadState("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      setPreviewUrl(null);
      return null;
    }
  }

  function reset(deleteUploaded = true) {
    if (deleteUploaded && uploadedPathRef.current) void deleteFile(uploadedPathRef.current);
    uploadedPathRef.current = null;
    setUploadState("idle");
    setUploadError(null);
    setPreviewUrl(null);
  }

  return { uploadState, uploadError, previewUrl, handleFile, reset, deleteFile, extractFilePath };
}

// ─── Module row type ──────────────────────────────────────────────────────────

interface ModuleRow {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl: string;
  instructions: string;
  actionTask: string;
}

function emptyModule(id: number, idx: number): ModuleRow {
  return { id, title: `Day ${idx + 1} Module`, type: "text", videoUrl: "", instructions: "", actionTask: "" };
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ program, onClose, onEdit }: { program: Program; onClose: () => void; onEdit: () => void }) {
  const modules      = Array.isArray(program.modules)      ? program.modules      as ModuleRow[] : [];
  const achievements = Array.isArray(program.achievements) ? program.achievements as string[]    : [];
  const statusKey    = (program.status ?? "DRAFT") as ProgramStatus;
  const cfg          = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {program.thumbnailUrl ? (
              <img src={program.thumbnailUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <BookOpen size={18} className="text-blue-500" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">{program.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
              <Pencil size={12} /> Edit
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Calendar size={14} />,     label: "Duration", value: `${program.durationDays ?? "?"} Days` },
              { icon: <BookOpenCheck size={14} />, label: "Modules",  value: String(modules.length) },
              { icon: <DollarSign size={14} />,   label: "Price",    value: formatPrice(program.price, program.currency) },
              { icon: <Users size={14} />,        label: "Unlock",   value: program.unlockType === "daily" ? "Daily" : "All at once" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400">{s.icon}
                  <span className="text-[10px] font-black uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-sm font-black text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {program.description && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</p>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">{program.description}</p>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Achievements</p>
              <div className="flex flex-wrap gap-2">
                {achievements.map((a, i) => (
                  <span key={i} className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Modules list */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modules ({modules.length})</p>
            {modules.map((mod, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800">{mod.title}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      mod.type === "video" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                    }`}>{mod.type?.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{mod.instructions}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1 line-clamp-1">↳ {mod.actionTask}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Certificate */}
          {program.certificateTitle && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <BookOpenCheck size={15} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Certificate</p>
                <p className="text-sm font-bold text-gray-800">{program.certificateTitle}</p>
                <p className="text-[11px] text-gray-500">Threshold: {program.completionThreshold}%</p>
              </div>
            </div>
          )}

          {/* Creator */}
          {program.creator && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
              {program.creator.image ? (
                <img src={program.creator.image} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
                  {program.creator.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Created by <span className="font-bold text-gray-700">{program.creator.name ?? program.creator.email}</span>
                {" · "}{formatDate(program.createdAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editData?: Program;
}

function CreateModal({ onClose, onSuccess, editData }: CreateModalProps) {
  const isEdit       = !!editData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgUpload    = useImageUpload();

  function toDurationLabel(days: number | null): "7 Days" | "14 Days" | "21 Days" | "30 Days" {
    if (days === 14) return "14 Days";
    if (days === 21) return "21 Days";
    if (days === 30) return "30 Days";
    return "7 Days";
  }

  // Store existing thumbnail Supabase path so we can delete it when user changes/removes
  const existingThumbPathRef = useRef<string | null>(
    editData?.thumbnailUrl ? imgUpload.extractFilePath(editData.thumbnailUrl) : null
  );

  const [title,        setTitle]        = useState(editData?.name        ?? "");
  const [subtitle,     setSubtitle]     = useState(editData?.description ?? "");
  const [duration,     setDuration]     = useState<"7 Days" | "14 Days" | "21 Days" | "30 Days">(
    toDurationLabel(editData?.durationDays ?? null)
  );
  const [unlockType,   setUnlockType]   = useState<"daily" | "all">((editData?.unlockType as "daily" | "all") ?? "daily");
  const [thumbnailUrl, setThumbnailUrl] = useState(editData?.thumbnailUrl ?? "");

  const initAch: string[] = Array.isArray(editData?.achievements) && (editData!.achievements as string[]).length
    ? editData!.achievements as string[] : [""];
  const [achievements, setAchievements] = useState<string[]>(initAch);

  const maxDays = parseInt(duration);
  const initMods: ModuleRow[] = Array.isArray(editData?.modules) && (editData!.modules as ModuleRow[]).length
    ? editData!.modules as ModuleRow[] : [emptyModule(1, 0)];
  const [modules,     setModules]  = useState<ModuleRow[]>(initMods);
  const [expandedMod, setExpanded] = useState<number>(0);

  const [isPaid,   setIsPaid]   = useState((editData?.price ?? 0) > 0);
  const [price,    setPrice]    = useState(editData?.price ? String(editData.price) : "");
  const [currency, setCurrency] = useState<"INR" | "USD">((editData?.currency as "INR" | "USD") ?? "INR");

  const [threshold, setThreshold] = useState(editData?.completionThreshold ?? 100);
  const [certTitle, setCertTitle] = useState(editData?.certificateTitle    ?? "");
  const [status,    setStatus]    = useState<ProgramStatus>((editData?.status as ProgramStatus) ?? "PUBLISHED");
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    setModules((prev) => {
      if (prev.length > maxDays) return prev.slice(0, maxDays);
      if (prev.length < maxDays)
        return [...prev, ...Array.from({ length: maxDays - prev.length }, (_, i) => emptyModule(Date.now() + i, prev.length + i))];
      return prev;
    });
  }, [maxDays]);

  const updateMod = <K extends keyof ModuleRow>(idx: number, key: K, val: ModuleRow[K]) =>
    setModules((ms) => ms.map((m, i) => i === idx ? { ...m, [key]: val } : m));

  async function deleteExistingThumb() {
    if (!existingThumbPathRef.current) return;
    await imgUpload.deleteFile(existingThumbPathRef.current);
    existingThumbPathRef.current = null;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim())     throw new Error("Program title is required.");
      if (!subtitle.trim())  throw new Error("Subtitle / description is required.");
      if (!certTitle.trim()) throw new Error("Certificate title is required.");

      const cleanAchievements = achievements.map((a) => a.trim()).filter(Boolean);
      if (!cleanAchievements.length) throw new Error("Add at least one achievement.");

      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        if (!m.title.trim())        throw new Error(`Day ${i + 1}: Module title is required.`);
        if (!m.instructions.trim()) throw new Error(`Day ${i + 1}: Instructions are required.`);
        if (!m.actionTask.trim())   throw new Error(`Day ${i + 1}: Action task is required.`);
        if (m.type === "video" && !m.videoUrl.trim()) throw new Error(`Day ${i + 1}: Video URL is required.`);
      }

      if (isPaid && (!price || parseFloat(price) <= 0)) throw new Error("Please enter a valid price.");

      const processedModules = modules.map((m) => ({
        id: m.id, title: m.title, type: m.type,
        videoUrl: m.type === "video" ? convertToEmbedUrl(m.videoUrl) : undefined,
        instructions: m.instructions, actionTask: m.actionTask,
      }));

      const payload = {
        name: title, description: subtitle,
        durationDays: parseInt(duration), unlockType,
        achievements: cleanAchievements, modules: processedModules,
        price: isPaid ? parseFloat(price) : 0, currency,
        completionThreshold: threshold, certificateTitle: certTitle,
        thumbnailUrl: thumbnailUrl || undefined, status,
      };

      if (isEdit) await updateProgram(editData!.id, payload);
      else        await createProgram(payload);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError:   (err) => setFormError(err instanceof Error ? err.message : "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? "Edit Program" : "Create Mini-Mastery Program"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
        </div>

        <div className="p-6 space-y-8">

          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600 font-medium">{formError}</p>
            </div>
          )}

          {/* Step 1 */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 1 — Program Basics
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Program Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 7-Day Mindful Morning Rituals"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Subtitle / Description *</label>
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} placeholder="Transformation promise..."
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  {["7 Days","14 Days","21 Days","30 Days"].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Unlock Type</label>
                <div className="flex gap-2">
                  {(["daily","all"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setUnlockType(t)}
                      className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                        unlockType === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                      }`}>
                      {t === "daily" ? "Daily" : "All at once"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Thumbnail <span className="text-gray-400 font-normal normal-case">Optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Delete existing DB image first before uploading new one
                  await deleteExistingThumb();
                  imgUpload.reset(true);
                  const url = await imgUpload.handleFile(file);
                  if (url) setThumbnailUrl(url);
                  e.target.value = "";
                }} />

              {(imgUpload.previewUrl ?? (isEdit && thumbnailUrl)) ? (
                <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border border-gray-100 group">
                  <img src={imgUpload.previewUrl ?? thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={imgUpload.uploadState === "uploading"}
                      className="bg-white text-gray-900 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                      <Upload size={12} /> Change
                    </button>
                    <button type="button"
                      onClick={async () => {
                        await deleteExistingThumb();
                        imgUpload.reset(true);
                        setThumbnailUrl("");
                      }}
                      disabled={imgUpload.uploadState === "uploading"}
                      className="bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                      <X size={12} /> Remove
                    </button>
                  </div>
                  {imgUpload.uploadState === "uploading" && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={imgUpload.uploadState === "uploading"}
                  className="w-full aspect-[16/7] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 transition-all disabled:cursor-not-allowed">
                  {imgUpload.uploadState === "uploading" ? (
                    <><Loader2 size={20} className="animate-spin text-blue-500" /><p className="text-xs font-bold text-blue-500">Uploading...</p></>
                  ) : (
                    <>
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"><ImageIcon size={18} className="text-gray-400" /></div>
                      <p className="text-xs font-bold text-gray-500">Click to upload thumbnail</p>
                      <p className="text-[10px] text-gray-400">JPG, PNG or WebP · Max 5MB</p>
                    </>
                  )}
                </button>
              )}
              {imgUpload.uploadError && <p className="text-[11px] text-red-500 font-medium">{imgUpload.uploadError}</p>}
            </div>
          </section>

          {/* Step 2 – Achievements */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 2 — Achievements
            </p>
            <div className="space-y-2">
              {achievements.map((ach, i) => (
                <div key={i} className="flex gap-2">
                  <input value={ach}
                    onChange={(e) => setAchievements((prev) => prev.map((a, j) => j === i ? e.target.value : a))}
                    placeholder={`Achievement ${i + 1}`}
                    className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  {achievements.length > 1 && (
                    <button type="button" onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {achievements.length < 10 && (
                <button type="button" onClick={() => setAchievements((prev) => [...prev, ""])}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">
                  <Plus size={14} /> Add Achievement
                </button>
              )}
            </div>
          </section>

          {/* Step 3 – Modules */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Step 3 — Modules ({modules.length}/{maxDays} days)
              </p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                modules.length >= maxDays ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
              }`}>{modules.length >= maxDays ? "Complete" : `${maxDays - modules.length} left`}</span>
            </div>
            <div className="space-y-2">
              {modules.map((mod, idx) => {
                const isOpen = expandedMod === idx;
                return (
                  <div key={mod.id} className={`border-2 rounded-2xl transition-all ${
                    isOpen ? "border-blue-400 p-4" : "border-gray-100 p-3 cursor-pointer hover:bg-gray-50"
                  }`}>
                    <div className="flex items-center justify-between" onClick={() => setExpanded(isOpen ? -1 : idx)}>
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          isOpen ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}>{idx + 1}</span>
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{mod.title || "Untitled"}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          mod.type === "video" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                        }`}>{mod.type.toUpperCase()}</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                    {isOpen && (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Module Title *</label>
                          <input value={mod.title} onChange={(e) => updateMod(idx, "title", e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Content Type</label>
                          <div className="flex gap-2">
                            {(["video","text"] as const).map((t) => (
                              <button key={t} type="button" onClick={() => updateMod(idx, "type", t)}
                                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  mod.type === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                                }`}>
                                {t === "video" ? <><Video size={13} /> Video</> : <><FileText size={13} /> Text</>}
                              </button>
                            ))}
                          </div>
                        </div>
                        {mod.type === "video" && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">YouTube URL *</label>
                            <input value={mod.videoUrl} onChange={(e) => updateMod(idx, "videoUrl", e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Instructions *</label>
                          <textarea value={mod.instructions} onChange={(e) => updateMod(idx, "instructions", e.target.value)}
                            rows={3} placeholder="What should participants focus on today?"
                            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">
                            Action Task * <span className="text-blue-500 font-black">Mandatory</span>
                          </label>
                          <textarea value={mod.actionTask} onChange={(e) => updateMod(idx, "actionTask", e.target.value)}
                            rows={2} placeholder="Ask a question or assign a task..."
                            className="w-full p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 4 – Pricing */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 4 — Pricing
            </p>
            <div className="flex gap-3">
              {([false,true] as const).map((paid) => (
                <button key={String(paid)} type="button" onClick={() => setIsPaid(paid)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    isPaid === paid ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                  }`}>{paid ? "Paid" : "Free"}</button>
              ))}
            </div>
            {isPaid && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Currency</label>
                  <div className="flex gap-2">
                    {(["INR","USD"] as const).map((c) => (
                      <button key={c} type="button" onClick={() => setCurrency(c)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          currency === c ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                        }`}>{c === "INR" ? "₹ INR" : "$ USD"}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Price *</label>
                  <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="499"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>
            )}
          </section>

          {/* Step 5 – Certificate */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 5 — Certificate
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Completion Threshold (%)</label>
                <input type="number" min="50" max="100" value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 100)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Certificate Title *</label>
                <input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Certificate of Completion"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
            </div>
          </section>

          {/* Publish Status */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Publish Status
            </p>
            <div className="flex gap-2 flex-wrap">
              {(["PUBLISHED","UNDER_REVIEW","DRAFT"] as ProgramStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    status === s ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                  }`}>{STATUS_CONFIG[s].label}</button>
              ))}
            </div>
          </section>

          {/* Submit */}
          <button type="button" onClick={() => { setFormError(null); mutation.mutate(); }}
            disabled={mutation.isPending || imgUpload.uploadState === "uploading"}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
            {mutation.isPending
              ? <><Loader2 size={16} className="animate-spin" /> {isEdit ? "Updating…" : "Creating…"}</>
              : <><Plus size={16} /> {isEdit ? "Update Program" : "Create Program"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMMPPage() {
  const qc = useQueryClient();

  const [page,        setPage]        = useState(1);
  const [statusFilter, setStatus]     = useState<ProgramStatus | "">("");
  const [search,       setSearch]     = useState("");
  const [searchInput,  setSearchInput] = useState("");
  const [showCreate,   setShowCreate]  = useState(false);
  const [viewProg,     setViewProg]    = useState<Program | null>(null);
  const [editProg,     setEditProg]    = useState<Program | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-mmp", page, statusFilter, search],
    queryFn:  () => fetchPrograms(page, statusFilter, search),
    staleTime: 20_000,
  });

  const programs   = data?.programs   ?? [];
  const pagination = data?.pagination;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProgramStatus }) => patchStatus(id, status),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ["admin-mmp"] }),
  });

  const handleFilter = (s: ProgramStatus | "") => { setStatus(s); setPage(1); };
  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };

  return (
    <div className="bg-white p-6 rounded-lg shadow min-h-screen font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Mini-Mastery Programs</h2>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm w-fit">
          <Plus size={16} /> Create New Program
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search programs…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Search
          </button>
          {search && (
            <button onClick={clearSearch} className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => handleFilter(e.target.value as ProgramStatus | "")}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
          <option value="">All Status</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button onClick={() => void refetch()} disabled={isLoading}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-40" title="Refresh">
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
        </button>
        {(statusFilter || search) && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
            <Filter size={11} />
            {statusFilter && <span>{STATUS_CONFIG[statusFilter].label}</span>}
            {search && <span>{search}</span>}
            <button onClick={() => { clearSearch(); handleFilter(""); }}><X size={11} className="ml-1" /></button>
          </div>
        )}
      </div>

      {/* Table */}
      {isError ? (
        <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg text-sm font-medium">
          <AlertCircle size={16} /> Failed to load programs. Please refresh.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Program","Status","Creator","Modules","Price","Created","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? <SkeletonRows /> : programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
                    {statusFilter || search ? "No programs match your filters." : "No programs found."}
                  </td>
                </tr>
              ) : programs.map((prog) => {
                const statusKey    = (prog.status ?? "DRAFT") as ProgramStatus;
                const cfg          = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;
                const isProcessing = statusMutation.isPending &&
                  (statusMutation.variables as { id: string })?.id === prog.id;

                return (
                  <tr key={prog.id} className="hover:bg-gray-50/50 transition-colors">

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {prog.thumbnailUrl ? (
                          <img src={prog.thumbnailUrl} alt={prog.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                            <BookOpen size={16} className="text-blue-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{prog.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{prog.durationDays ?? "?"} Days</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {prog.creator?.image ? (
                          <img src={prog.creator.image} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
                            {prog.creator?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-xs text-gray-600 font-medium">
                          {prog.creator?.name ?? prog.creator?.email ?? "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 font-medium">{moduleCount(prog.modules)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-800">{formatPrice(prog.price, prog.currency)}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">{formatDate(prog.createdAt)}</td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">

                        {/* View → modal */}
                        <button onClick={() => setViewProg(prog)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View">
                          <Eye size={15} />
                        </button>

                        {/* Edit → modal */}
                        <button onClick={() => setEditProg(prog)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>

                        {/* Approve */}
                        <button onClick={() => statusMutation.mutate({ id: prog.id, status: "PUBLISHED" })}
                          disabled={isProcessing || statusKey === "PUBLISHED"}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Approve">
                          {isProcessing && (statusMutation.variables as { status: string })?.status === "PUBLISHED"
                            ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                        </button>

                        {/* Under Review */}
                        <button onClick={() => statusMutation.mutate({ id: prog.id, status: "UNDER_REVIEW" })}
                          disabled={isProcessing || statusKey === "UNDER_REVIEW"}
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Under Review">
                          {isProcessing && (statusMutation.variables as { status: string })?.status === "UNDER_REVIEW"
                            ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                        </button>

                        {/* Draft */}
                        <button onClick={() => statusMutation.mutate({ id: prog.id, status: "DRAFT" })}
                          disabled={isProcessing || statusKey === "DRAFT"}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Draft">
                          {isProcessing && (statusMutation.variables as { status: string })?.status === "DRAFT"
                            ? <Loader2 size={15} className="animate-spin" /> : <span className="text-[9px] font-black">D</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-700">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)}</span>
            {" "}of <span className="font-bold text-gray-700">{pagination.total}</span> programs
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "..." ? (
                <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    page === p ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-500 border border-gray-100"
                  }`}>{p}</button>
              ))}
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProg && (
        <ViewModal
          program={viewProg}
          onClose={() => setViewProg(null)}
          onEdit={() => { setEditProg(viewProg); setViewProg(null); }}
        />
      )}

      {/* Edit Modal */}
      {editProg && (
        <CreateModal
          editData={editProg}
          onClose={() => setEditProg(null)}
          onSuccess={() => { void qc.invalidateQueries({ queryKey: ["admin-mmp"] }); setEditProg(null); }}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => void qc.invalidateQueries({ queryKey: ["admin-mmp"] })}
        />
      )}
    </div>
  );
}