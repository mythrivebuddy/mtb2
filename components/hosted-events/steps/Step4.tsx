/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import {
  FileText,
  Trash2,
  Globe,
  Link as LinkIcon,
  FileEdit,
  Calendar,
  Users,
  Lightbulb,
  CheckCircle2,
  Share,
  Files,
} from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme"; // Adjust path if necessary

export default function Step4() {
  const [visibility, setVisibility] = useState<"public" | "private" | "draft">(
    "public",
  );
//   const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

const [files, setFiles] = useState<File[]>([]);
// const [isDragging, setIsDragging] = useState(false);
const handleFiles = (selectedFiles: FileList | null) => {
  if (!selectedFiles) return;

  const validFiles: File[] = [];

  Array.from(selectedFiles).forEach((file) => {
    const isValidType =
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // docx
      file.type === "application/msword" || // doc
      file.type === "application/vnd.apple.keynote" || // keynote (rare browser support)
      file.name.endsWith(".key"); // fallback for keynote

    if (!isValidType) {
      alert(`${file.name} is not a supported file`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert(`${file.name} exceeds 25MB`);
      return;
    }

    validFiles.push(file);
  });

  setFiles((prev) => [...prev, ...validFiles]);
};
// const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//   e.preventDefault();
//   setIsDragging(false);
//   handleFiles(e.dataTransfer.files);
// };
  return (
    <div className="mx-auto px-4 sm:px-6  mt-8 relative">
      <h2 className={`${theme.typography.h1} text-2xl`}>Finalize & Launch</h2>
      <div className=" mx-auto mt-2 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configuration Columns */}
          <div className="lg:col-span-7 space-y-8">
            {/* Resources Section */}
            <section
              className={`bg-white p-6 md:p-8 rounded-xl shadow-sm border ${theme.borderLight}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`${theme.typography.h1} text-xl`}>
                    Resources & Materials
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    Upload workbooks, pre-reads, or guides for your attendees.
                  </p>
                </div>
                <Files className={`w-8 h-8 ${theme.textAccent}`} />
              </div>

              {/* Upload Dropzone */}
              <label htmlFor="resourceUpload">
    <input
  type="file"
  id="resourceUpload"
  multiple
  accept=".pdf,.doc,.docx,.key"
  className="hidden"
  onChange={(e) => handleFiles(e.target.files)}
/>
              <div
                className={`border-2 border-dashed  rounded-xl p-10 flex flex-col items-center justify-center text-center group ${theme.borderAccent} transition-colors cursor-pointer bg-gray-50/50`}
              >
                <div
                  className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <FileText className={`w-8 h-8 ${theme.textDark}`} />
                </div>
                <h4 className="text-sm font-bold mb-1">
                  Click to upload or drag and drop
                </h4>
                <p className="text-xs opacity-70">
                  PDF, DOCX, or Keynote (Max 25MB)
                </p>
              </div>
              </label>

              {/* Uploaded Files List */}
             <div className="mt-6 space-y-3">
  {files.map((file, index) => (
    <div
      key={index}
      className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border ${theme.borderLight}`}
    >
      <div className="flex items-center gap-4">
        <FileText className={`w-6 h-6 ${theme.textAccent}`} />
        <div>
          <p className="text-sm font-bold">{file.name}</p>
          <p className="text-xs opacity-70">
            {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
          </p>
        </div>
      </div>

      <button
        onClick={() =>
          setFiles((prev) => prev.filter((_, i) => i !== index))
        }
        className="opacity-40 hover:opacity-100 hover:text-red-600 transition-colors p-2"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  ))}
</div>
            </section>

            {/* Visibility Settings */}
            <section
              className={`bg-white p-6 md:p-8 rounded-xl shadow-sm border ${theme.borderLight}`}
            >
              <h3 className={`${theme.typography.h1} text-xl mb-6`}>
                Visibility Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Public Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    className="peer sr-only"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  <div
                    className={`h-full p-6 border rounded-xl flex flex-col items-center text-center transition-all ${visibility === "public" ? `${theme.borderAccent} ` : `${theme.borderLight} hover:border-gray-400`}`}
                  >
                    <Globe
                      className={`w-8 h-8 mb-4 ${visibility === "public" ? theme.textAccent : "opacity-40"}`}
                    />
                    <p className="text-sm font-bold">Public</p>
                    <p className="text-xs opacity-70 mt-2">
                      Listed in Discovery feed for everyone.
                    </p>
                  </div>
                </label>

                {/* Private Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    className="peer sr-only"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  <div
                    className={`h-full p-6 border rounded-xl flex flex-col items-center text-center transition-all ${visibility === "private" ? `${theme.borderAccent} ` : `${theme.borderLight} hover:border-gray-400`}`}
                  >
                    <LinkIcon
                      className={`w-8 h-8 mb-4 ${visibility === "private" ? theme.textAccent : "opacity-40"}`}
                    />
                    <p className="text-sm font-bold">Private</p>
                    <p className="text-xs opacity-70 mt-2">
                      Only accessible via direct invite link.
                    </p>
                  </div>
                </label>

                {/* Draft Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    className="peer sr-only"
                    checked={visibility === "draft"}
                    onChange={() => setVisibility("draft")}
                  />
                  <div
                    className={`h-full p-6 border rounded-xl flex flex-col items-center text-center transition-all ${visibility === "draft" ? `${theme.borderAccent} ` : `${theme.borderLight} hover:border-gray-400`}`}
                  >
                    <FileEdit
                      className={`w-8 h-8 mb-4 ${visibility === "draft" ? theme.textAccent : "opacity-40"}`}
                    />
                    <p className="text-sm font-bold">Draft</p>
                    <p className="text-xs opacity-70 mt-2">
                      Hidden from all views until published.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-5 sticky top-[100px]">
            <div
              className={`bg-gray-50 p-6 rounded-2xl border ${theme.borderLight}`}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h4
                  className={`text-xs font-bold uppercase tracking-widest ${theme.textAccent}`}
                >
                  Live Preview
                </h4>
                <span className="text-xs opacity-70">
                  How it looks to seekers
                </span>
              </div>

              {/* Card Preview */}
              <article
                className={`bg-white rounded-xl overflow-hidden shadow-sm border ${theme.borderLight} transform transition-transform hover:scale-[1.01]`}
              >
                <div className="h-56 w-full relative">
                  <img
                    src="https://images.unsplash.com/photo-1545224144-b38cd301e22f?q=80&w=800&h=600&fit=crop"
                    alt="Event Image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                    <span className={`text-sm font-bold ${theme.textAccent}`}>
                      $149
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex gap-2 mb-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                      Mindset
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                      3 Days
                    </span>
                  </div>

                  <h3 className={`${theme.typography.h1} text-xl mb-3`}>
                    The Ascent: Peak Performance Masterclass
                  </h3>

                  <div className="flex items-center gap-3 mb-6">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&fit=crop"
                      alt="Coach Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-xs opacity-70 font-medium">
                      Hosted by Julian Thorne
                    </span>
                  </div>

                  <div
                    className={`pt-4 border-t ${theme.borderLight} flex justify-between items-center`}
                  >
                    <div className="flex items-center gap-2 opacity-70">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">Starts Oct 12</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium">12 Spots left</span>
                    </div>
                  </div>
                </div>
              </article>

              {/* Tip Box */}
              <div
                className={`mt-6 p-6 text-white ${theme.highLightBgColor} rounded-xl border ${theme.hightLightBorderColor} flex gap-4`}
              >
                <Lightbulb className={`w-6 h-6 ${theme.textAccent} shrink-0`} />
                <div>
                  <p className={`text-sm font-bold `}>Coach's Pro Tip</p>
                  <p className="text-sm  mt-1">
                    Events with at least one high-quality PDF workbook see
                    a 40% higher completion rate. Consider adding a 'Session
                    Zero' guide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div
              className={`w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-8`}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className={`${theme.typography.h1} text-4xl mb-4`}>
              It's Official.
            </h2>
            <p className="text-base opacity-70 mb-10">
              The Ascent: Peak Performance Masterclass is now live. Your
              community is waiting for their next transformation.
            </p>

            <div className="flex flex-col gap-3">
              <button
                className={`w-full py-4 ${theme.buttonDark} rounded-xl text-sm font-semibold shadow-md transition-opacity hover:opacity-90`}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`w-full py-4 border ${theme.borderLight} rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2`}
              >
                <Share className="w-4 h-4" />
                Share Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
