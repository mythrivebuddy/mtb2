"use client";

import React, { useState } from "react";
import {  ImagePlus } from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import { Editor } from "@tinymce/tinymce-react";

export default function Step1() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
   
  const categories = [
    "Retreat",
    "Webinar",
    "Workshop",
    "One-on-One",
    "Course",
    "Other",
  ];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files?.[0]) {
      setPreviewImage(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

const handleFile = (file: File) => {
  if (!file) return;

  // validation
  if (!file.type.startsWith("image/")) {
    alert("Only images are allowed");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File must be under 5MB");
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  setPreviewImage(imageUrl);
};
  return (
    <div className={`${theme.textDark} min-h-screen flex flex-col`}>
      <main className="flex-1 pb-12 px-4 sm:px-6">
        {/* Form */}
        <section className="p-8 rounded-xl shadow-sm border bg-white space-y-12">
          {/* Title */}
          <div>
            <label className="text-base font-semibold uppercase tracking-widest">
              Event Title
            </label>
            <input
              type="text"
              placeholder="e.g., Mindfulness Retreat to Reduce Stress & Recharge"
              className={`${theme.eventTitleInput} ${theme.typography.h1} text-3xl py-4`}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-base font-semibold uppercase tracking-widest">
              Event Category
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`${theme.chip} ${
                    activeCategory === cat
                      ? theme.chipActive
                      : theme.chipInactive
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div>
            <label className="text-base font-semibold uppercase tracking-widest">
              Description
            </label>

            <div className={theme.editorContainer}>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                init={{
                  height: 300,
                  menubar: false,
                  plugins: ["lists", "link", "image"],
                  toolbar: "bold italic | bullist numlist | link",
                }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <label className="text-base font-semibold uppercase tracking-widest">
              Pricing & Capacity
            </label>

            <div className={theme.inputGroup}>
              <input
                type="number"
                placeholder="Price"
                className={theme.inputBase}
              />

              <select className={theme.select}>
                <option>INR (₹)</option>
                <option>USD ($)</option>
              </select>

              <input
                type="number"
                placeholder="Capacity"
                className={theme.inputBase}
              />
            </div>
          </div>

          {/* Image */}
          {/* Image */}
          <div className="space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
              Cover Photo
            </label>
<label htmlFor="fileUpload">
    <input
  type="file"
  accept="image/*"
  id="fileUpload"
  className="hidden"
   onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }}
/>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`${theme.dropzoneBase} ${
                isDragging ? theme.dropzoneActive : theme.dropzoneIdle
              }`}
            >
              {!previewImage ? (
                <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 opacity-70" />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag and drop or{" "}
                      <span className="underline">browse files</span>
                    </p>

                    <p className="text-xs opacity-70 mt-1">
                      Recommended: 1600x900px, under 5MB
                    </p>
                  </div>
                </div>
              ) : (
                  <img
                  src={previewImage}
                  alt="Event Cover"
                  className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
            </div>
                </label>
          </div>
        </section>
      </main>
    </div>
  );
}
