"use client";

import React from "react";
import { 
  Rocket, 
  Activity, 
  Wallet, 
  Edit2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Quote, 
  Flag, 
  Brain,
  Hash,
  Leaf
} from "lucide-react";

interface Step5Props {
  formData: {
    selectedAreas: string[];
    areaGoals: Record<string, string>;
    identities: Record<string, string>;
    vision: string;
  };
  onBack: () => void;
  onComplete: () => void;
}

const AREA_ICONS: Record<string, { icon: React.ElementType, color: string, bg: string, label: string }> = {
  health: { icon: Activity, color: "text-[#059669]", bg: "bg-[#ecfdf5]", label: "Physical Vitality" },
  career: { icon: Rocket, color: "text-[#2563eb]", bg: "bg-[#eff6ff]", label: "Career & Growth" },
  wealth: { icon: Wallet, color: "text-[#d97706]", bg: "bg-[#fffbeb]", label: "Financial Freedom" },
  mindset: { icon: Brain, color: "text-[#7c3aed]", bg: "bg-[#f5f3ff]", label: "Mindset Shift" },
  default: { icon: Leaf, color: "text-[#059669]", bg: "bg-[#ecfdf5]", label: "Growth Area" }
};

const Step5VisionSummary = ({ formData, onBack, onComplete }: Step5Props) => {
  return (
    <div className="flex min-h-screen flex-col bg-[#f0fdf4] font-['Inter'] text-[#064e3b]">
      
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8 md:px-10 md:py-12">
        {/* Progress Tracker */}
        <div className="mx-auto mb-12 flex max-w-3xl flex-col gap-3">
          <div className="flex items-end justify-between gap-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10b981]">Step 5 of 5</p>
            <p className="text-sm font-normal text-gray-500">Final Review</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#d1fae5]">
            <div className="h-full w-full rounded-full bg-[#10b981] transition-all duration-500 ease-out" />
          </div>
        </div>

        {/* Hero Section */}
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4  text-left">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl text-[#064e3b]">Your 2026 Blueprint</h1>
          <p className="max-w-xl text-lg leading-relaxed text-[#374151]">
            This summary represents your core commitments. Take a final look before we generate your program rules.
          </p>
        </div>

        {/* Vision Statement Card */}
        <div className="mx-auto mb-16 max-w-4xl">
          <div className="group relative overflow-hidden rounded-3xl border border-[#d1fae5] bg-gradient-to-br from-white to-[#f0fdf4] p-8 shadow-lg text-center md:p-10">
            <Quote className="absolute top-6 left-6 size-12 text-[#10b981] opacity-10 group-hover:opacity-20 transition-opacity" />
            <Quote className="absolute bottom-6 right-6 size-12 rotate-180 text-[#10b981] opacity-10 group-hover:opacity-20 transition-opacity" />
            
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#10b981]">My Annual Vision Statement</h3>
            <p className="mx-auto max-w-2xl text-2xl font-bold leading-snug md:text-3xl text-[#064e3b]">
              "{formData.vision || "I am stepping into 2026 with purpose, health, and a commitment to my ultimate growth."}"
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 mb-16">
          <div className="flex flex-col gap-6 lg:col-span-8">
            {formData.selectedAreas.map((areaId) => {
              const config = AREA_ICONS[areaId] || AREA_ICONS.default;
              const Icon = config.icon;
              return (
                <div key={areaId} className="group relative flex flex-col gap-6 rounded-2xl border border-[#d1fae5] bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#10b981] hover:shadow-md md:flex-row md:p-8">
                  <div className="flex-shrink-0">
                    <div className={`flex size-14 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
                      <Icon size={32} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 text-left">
                    <div className="flex items-start justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                    </div>
                    <h3 className="text-xl font-bold leading-tight text-[#064e3b]">{formData.areaGoals[areaId]}</h3>
                    <div className="my-1 h-px w-full bg-[#d1fae5]" />
                    <div className="flex gap-2 items-start">
                      <Quote size={20} className={`${config.color} mt-0.5 opacity-50`} />
                      <p className="text-base font-medium italic leading-relaxed text-[#374151]">
                        {formData.identities[areaId]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Commitment Summary Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-[#d1fae5] bg-white p-6 shadow-sm">
              <h4 className="mb-6 flex items-center gap-2 text-lg font-bold text-[#064e3b]">
                <CheckCircle2 size={20} className="text-[#10b981]" />
                Blueprint Statistics
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-[#f0fdf4] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                      <Hash size={14} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Focus Areas</span>
                  </div>
                  <span className="text-lg font-bold text-[#10b981]">{formData.selectedAreas.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#f0fdf4] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                      <Brain size={14} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Identity Statements</span>
                  </div>
                  <span className="text-lg font-bold text-[#10b981]">{Object.keys(formData.identities).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#d1fae5]">
          <button 
            onClick={onBack}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#d1fae5] bg-white px-8 py-4 text-base font-bold text-[#374151] transition-all hover:bg-gray-50 active:scale-95"
          >
            <ArrowLeft size={20} />
            Back to Vision
          </button>
          
          <button 
            onClick={onComplete}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#10b981] px-10 py-4 text-base font-bold text-white shadow-lg shadow-[#10b981]/20 transition-all hover:bg-[#059669] hover:shadow-[#10b981]/40 active:scale-95"
          >
            Confirm & Proceed
            <ArrowRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Step5VisionSummary;