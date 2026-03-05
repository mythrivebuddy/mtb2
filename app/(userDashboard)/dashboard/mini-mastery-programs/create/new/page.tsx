"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Step1ProgramBasics from "@/components/mini-mastery-program/create-program/Step1ProgramBasics";
import Step2ProgramAchievements from "@/components/mini-mastery-program/create-program/Step2ProgramAchivements";
import Step3ModuleBuilder from "@/components/mini-mastery-program/create-program/Step3ModuleBuilder";
import Step4PricingStrategy from "@/components/mini-mastery-program/create-program/Step4PricingStrategy";
import Step5CompletionCertificate from "@/components/mini-mastery-program/create-program/Step5CompletionCertificate";
import Step6ReviewAndPublish from "@/components/mini-mastery-program/create-program/Step6ReviewAndPublish";

import {
  MMP_STORAGE_KEY,
  type FullFormData,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
  type Step5Data,
  type ProgramDBPayload,
} from "@/schema/zodSchema";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadFromStorage(): Partial<FullFormData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MMP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function clearStorage() {
  localStorage.removeItem(MMP_STORAGE_KEY);
}

// ─── Step Info ────────────────────────────────────────────────────────────────

const STEP_INFO = [
  { label: "Program Basics",           next: "Content Structure" },
  { label: "MMP Creation Flow",         next: "Module Builder" },
  { label: "Daily Module Builder",      next: "Pricing Strategy" },
  { label: "Pricing Strategy",          next: "Completion & Certificate" },
  { label: "Completion & Certificate",  next: "Review & Publish" },
  { label: "Review & Publish",          next: "Finish" },
] as const;

const TOTAL_STEPS = 6;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CreateProgramPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Central form state — all steps live here
  const [formData, setFormData] = useState<Partial<FullFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setFormData(loadFromStorage());
  }, []);

  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleStep1Next = (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, step1: data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, step2: data }));
    setCurrentStep(3);
  };

  const handleStep3Next = (data: Step3Data) => {
    setFormData((prev) => ({ ...prev, step3: data }));
    setCurrentStep(4);
  };

  const handleStep4Next = (data: Step4Data) => {
    setFormData((prev) => ({ ...prev, step4: data }));
    setCurrentStep(5);
  };

  const handleStep5Next = (data: Step5Data) => {
    setFormData((prev) => ({ ...prev, step5: data }));
    setCurrentStep(6);
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // ── API Calls (owned here, passed down to Step6) ─────────────────────────

  const handleSubmitForReview = async (payload: ProgramDBPayload) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/mini-mastery-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("API Response:", res);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Server error: ${res.status}`);
      }

      clearStorage();
      toast.success("Program submitted for review successfully!");
      router.push("/dashboard/mini-mastery-programs/create");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(message);
      throw err;
    }
  };

  const handleSaveDraft = async (payload: ProgramDBPayload) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/programs/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Server error: ${res.status}`);
      }

      clearStorage();
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save draft. Please try again.";
      setSubmitError(message);
      throw err;
    }
  };

  // ── Guard: don't render Step6 unless all steps are filled ───────────────
  const isFormComplete =
    !!formData.step1 &&
    !!formData.step2 &&
    !!formData.step3 &&
    !!formData.step4 &&
    !!formData.step5;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-10 px-4">
      {/* Progress Header */}
      <div className="w-full max-w-4xl mb-10">
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              STEP {currentStep} OF {TOTAL_STEPS}
            </span>
            <h3 className="text-gray-900 font-bold text-sm mt-1">
              {STEP_INFO[currentStep - 1]?.label}
            </h3>
          </div>
          <span className="text-blue-600 font-bold text-sm">{progress}%</span>
        </div>

        <div className="w-full h-[6px] bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-400 text-[11px] italic mt-3">
          Next: {STEP_INFO[currentStep - 1]?.next}
        </p>
      </div>

      {/* Global API Error Banner */}
      {submitError && (
        <div className="w-full max-w-4xl mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-6 py-4 rounded-2xl">
          {submitError}
        </div>
      )}

      {/* Form Card */}
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-10 md:p-16 min-h-[500px]">
        {currentStep === 1 && (
          <Step1ProgramBasics
            onNext={handleStep1Next}
            defaultValues={formData.step1}
          />
        )}
        {currentStep === 2 && (
          <Step2ProgramAchievements
            onNext={handleStep2Next}
            onBack={handleBack}
            defaultValues={formData.step2}
          />
        )}
        {currentStep === 3 && (
          <Step3ModuleBuilder
            onNext={handleStep3Next}
            onBack={handleBack}
            defaultValues={formData.step3}
            maxDays={parseInt(formData.step1?.duration ?? "7")}
          />
        )}
        {currentStep === 4 && (
          <Step4PricingStrategy
            onNext={handleStep4Next}
            onBack={handleBack}
            defaultValues={formData.step4}
          />
        )}
        {currentStep === 5 && (
          <Step5CompletionCertificate
            onNext={handleStep5Next}
            onBack={handleBack}
            defaultValues={formData.step5}
          />
        )}
        {currentStep === 6 && isFormComplete && (
          <Step6ReviewAndPublish
            formData={formData as FullFormData}
            onBack={handleBack}
            onSubmit={handleSubmitForReview}
            onSaveDraft={handleSaveDraft}
          />
        )}
      </div>
    </div>
  );
}