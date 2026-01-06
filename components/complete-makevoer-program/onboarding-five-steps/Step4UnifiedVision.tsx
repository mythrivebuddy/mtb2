/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Edit3,
  Image as ImageIcon,
  UploadCloud,
  Lightbulb,
  Sparkles,
  Zap,
  Heart,
  Info,
} from "lucide-react";
import OnboardingStickyFooter from "../OnboardingStickyFooter";

interface Step4Props {
  onBack: () => void;
  onNext: (vision: string) => void;
  initialVision: string;
  visionImageUrl?: string;
}

const EXAMPLES = [
  {
    id: "leader",
    title: "The High-Growth Leader",
    icon: Sparkles,
    text: "I am scaling my company to market dominance while maintaining peak physical vitality and cultivating deep, joyful connections with my family every single day.",
  },
  {
    id: "creator",
    title: "The Holistic Creator",
    icon: Zap,
    text: "My creative business flows effortlessly, funding a life of global travel and vibrant health, where my work is my passion and my downtime is sacred.",
  },
  {
    id: "professional",
    title: "The Purpose-Driven Professional",
    icon: Heart,
    text: "I lead with empathy and impact in my career, fueled by a rigorous fitness routine and a calm mind, ensuring I am the best version of myself for my community.",
  },
];

const Step4UnifiedVision = ({ onBack, onNext,initialVision,visionImageUrl }: Step4Props) => {
  const [vision, setVision] = useState("");
  const maxLength = 500;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic validation
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };
  useEffect(() => {
    setVision(initialVision);
  }, [initialVision]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
const handleNext = () => {
  if (selectedImage) {
    const formData = new FormData();
    formData.append("image", selectedImage);

    // fire-and-forget
    fetch("/api/makeover-program/onboarding/step-4-vision-images", {
      method: "POST",
      body: formData,
    }).catch(() => {
      // optional: silent fail or log
      console.warn("Vision image upload failed");
    });
  }

  // immediately move to next step
  onNext(vision);
};


  const handleExampleClick = (text: string) => {
    setVision(text);

    // Give React a tick to update the value
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();

        // Mobile-friendly scroll
        textareaRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Optional: move cursor to end
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    });
  };

  return (
    <div className="min-h-screen w-full  font-sans text-[#0d1b12]">
      <main className="flex justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="flex w-full max-w-[1024px] flex-col gap-8">
          {/* Progress Bar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4c9a66]">
                Step 4 of 5
              </p>
              <span className="text-sm font-medium text-[#11d452]">
                80% Completed
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#cfe7d7] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#11d452] transition-all duration-500 ease-out"
                style={{ width: "80%" }}
              />
            </div>
          </div>

          {/* Title Section */}
          <div className="flex flex-col gap-3 md:pr-20 text-left">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
              What is your Unified Vision for 2026?
            </h1>
            <p className="text-lg text-[#4c9a66] max-w-2xl">
              Draft one combined statement that weaves together your career,
              health, and personal goals into a single narrative. Keep it bold
              and cohesive.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Input Column */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              <div className="flex flex-col gap-2 group">
                <label
                  className="text-base font-semibold flex items-center justify-between"
                  htmlFor="vision-statement"
                >
                  <span className="flex items-center gap-2">
                    <Edit3 size={20} className="text-[#11d452]" />
                    Your Unified Vision Statement
                  </span>
                  <span className="hidden sm:inline-block text-xs font-normal text-[#4c9a66] bg-[#11d452]/5 px-2 py-0.5 rounded">
                    Includes all 3 areas
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    id="vision-statement"
                    minLength={10}
                    value={vision}
                    onChange={(e) =>
                      setVision(e.target.value.slice(0, maxLength))
                    }
                    className="w-full min-h-[240px] resize-none rounded-2xl border-2 border-[#cfe7d7] bg-white p-6 text-lg leading-relaxed placeholder:text-[#4c9a66]/60 focus:border-[#11d452] focus:ring-0 focus:outline-none shadow-sm transition-all duration-200"
                    placeholder="In 2026, I am an energetic leader growing my startup..."
                  />
                  <div className="absolute bottom-4 right-4 text-xs font-medium text-[#4c9a66] bg-[#f8fcf9] px-2 py-1 rounded">
                    {vision.length}/{maxLength} characters
                  </div>
                </div>
                <p className="text-sm text-[#4c9a66] mt-1 px-1">
                  Aim for a sentence or two that captures the feeling of your
                  whole life working in harmony.
                </p>
              </div>

              {/* Upload Section */}
              <div className="flex flex-col gap-4 pt-4 border-t border-dashed border-[#cfe7d7]">
                <div className="flex flex-col gap-1 text-left">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon size={20} className="text-[#11d452]" />
                    Visualize it (Optional)
                  </h3>
                  <p className="text-sm text-[#4c9a66]">
                    Upload your digital vision board or a motivational photo.
                  </p>
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex h-[20rem] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cfe7d7] bg-white  hover:border-[#11d452]/50 hover:bg-[#11d452]/5 transition-colors group"
                >
                  {(previewUrl || visionImageUrl) ? (
                    <img
                      src={previewUrl || visionImageUrl}
                      alt="Vision preview"
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-[#11d452]/10 p-4 text-[#11d452] group-hover:bg-[#11d452] group-hover:text-white transition-colors">
                        <UploadCloud size={30} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold">
                          Click to upload 
                        </p>
                        <p className="text-xs text-[#4c9a66]">
                          PNG, JPG (max. 5MB)
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>

            {/* Inspiration Column */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#cfe7d7]">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                  <Lightbulb
                    size={22}
                    className="text-yellow-500 fill-current"
                  />
                  Spark Inspiration
                </h3>
                <p className="text-sm text-[#4c9a66] mb-5">
                  See how a unified vision brings everything together. Click any
                  example to use it as a starting point.
                </p>
                <div className="flex flex-col gap-3">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.id}
                      onClick={() => handleExampleClick(example.text)}
                      className="text-left group flex flex-col gap-3 rounded-xl border border-[#cfe7d7] bg-[#f8fcf9] p-4 hover:border-[#11d452] hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <example.icon size={16} className="text-[#11d452]" />
                        <span className="text-xs font-bold text-[#11d452] tracking-wide uppercase">
                          {example.title}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        "{example.text}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 rounded-xl bg-[#11d452]/10 p-4 border border-[#11d452]/20">
                <Info size={20} className="text-[#11d452] shrink-0" />
                <p className="text-sm">
                  <span className="font-bold">Pro Tip:</span> Don't worry about
                  perfection. A unified vision helps you see the big picture.
                </p>
              </div>
            </div>
          </div>

          <OnboardingStickyFooter
            onBack={onBack}
            onNext={handleNext}
            nextLabel="Next Step"
            disabled={!vision.trim().length || vision.trim().length < 10}
          />
        </div>
      </main>
    </div>
  );
};

export default Step4UnifiedVision;
