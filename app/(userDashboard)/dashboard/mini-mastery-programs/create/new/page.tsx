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
  type FullFormData,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
  type Step5Data,
} from "@/schema/zodSchema";
import { MMP_STORAGE_KEY, ProgramDBPayload } from "@/types/client/mini-mastery-program";
import { toast } from "sonner";

// ─── Storage keys ─────────────────────────────────────────────────────────────
const DRAFT_ID_KEY = `${MMP_STORAGE_KEY}_draftId`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadFromStorage(): Partial<FullFormData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MMP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadDraftId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DRAFT_ID_KEY);
}

function saveDraftId(id: string) {
  localStorage.setItem(DRAFT_ID_KEY, id);
}

function clearStorage() {
  localStorage.removeItem(MMP_STORAGE_KEY);
  localStorage.removeItem(DRAFT_ID_KEY);
}

// ─── Partial payload builder ──────────────────────────────────────────────────

function buildPartialPayload(data: Partial<FullFormData>): Record<string, unknown> {
  return {
    ...(data.step1 && {
      name:         data.step1.title,
      description:  data.step1.subtitle,
      durationDays: parseInt(data.step1.duration),
      unlockType:   data.step1.unlockType,
      thumbnailUrl: data.step1.thumbnailUrl ?? "",
    }),
    ...(data.step2 && {
      achievements: data.step2.achievements.map((a) => a.value),
    }),
    ...(data.step3 && {
      modules: data.step3.modules,
    }),
    ...(data.step4 && {
      price:    data.step4.isPaid ? parseFloat(data.step4.price) : 0,
      currency: data.step4.currency,
    }),
    ...(data.step5 && {
      completionThreshold: data.step5.threshold,
      certificateTitle:    data.step5.certTitle,
    }),
  };
}

// ─── Step Info ────────────────────────────────────────────────────────────────

const STEP_INFO = [
  { label: "Program Basics",           next: "Content Structure"        },
  { label: "MMP Creation Flow",        next: "Module Builder"           },
  { label: "Daily Module Builder",     next: "Pricing Strategy"         },
  { label: "Pricing Strategy",         next: "Completion & Certificate" },
  { label: "Completion & Certificate", next: "Review & Publish"         },
  { label: "Review & Publish",         next: "Finish"                   },
] as const;

const TOTAL_STEPS = 6;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CreateProgramPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData,    setFormData]    = useState<Partial<FullFormData>>({});
  const [draftId,     setDraftId]     = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

useEffect(()=>{
  if(localStorage.getItem(DRAFT_ID_KEY)){
    localStorage.removeItem(DRAFT_ID_KEY)
  }
}, [])

  // ── Hydrate from localStorage on mount ──────────────────────────────────────
  // new/page.tsx already clear kar chuka hoga agar naya program hai
  // toh yahan sirf jo bhi localStorage mein hai woh load karo
  useEffect(() => {
    const savedDraftId  = loadDraftId();
    const savedFormData = loadFromStorage();

    // Agar draftId hai but formData nahi — stale/orphan draft, clear karo
    if (savedDraftId && !savedFormData.step1) {
      clearStorage();
      setFormData({});
      setDraftId(null);
      return;
    }

    setFormData(savedFormData);
    setDraftId(savedDraftId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);

  // ── Auto-save draft to DB ──────────────────────────────────────────────────

  const autoSaveDraft = async (newStepData: Partial<FullFormData>) => {
    try {
      const merged  = { ...formData, ...newStepData };
      const partial = buildPartialPayload(merged);

      if (!partial.name) return;

      // localStorage se fresh read karo — stale closure fix
      const currentDraftId = loadDraftId();

      if (currentDraftId) {
        await fetch("/api/mini-mastery-programs", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ id: currentDraftId, ...partial, status: "DRAFT" }),
        });
      } else {
        const minFields = {
          name:                partial.name,
          description:         ((partial.description as string)?.trim() || "Draft").slice(0, 300),
          durationDays:        partial.durationDays ?? 7,
          unlockType:          partial.unlockType   ?? "daily",
          achievements:        (partial.achievements as string[])?.length
                                 ? partial.achievements
                                 : ["Achievement 1"],
          modules:             (partial.modules as unknown[])?.length
                                 ? partial.modules
                                 : [{
                                     id: 1, title: "Module 1", type: "text",
                                     instructions: "Instructions", actionTask: "Action task",
                                   }],
          price:               partial.price    ?? 0,
          currency:            partial.currency ?? "INR",
          completionThreshold: partial.completionThreshold ?? 100,
          certificateTitle:    partial.certificateTitle    ?? "Certificate of Completion",
          thumbnailUrl:        partial.thumbnailUrl        ?? "",
          status:              "DRAFT",
        };

        const res = await fetch("/api/mini-mastery-programs", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(minFields),
        });

        if (res.ok) {
          const json = await res.json() as { program: { id: string } };
          setDraftId(json.program.id);
          saveDraftId(json.program.id);
        }
      }
    } catch (err) {
      console.error("Auto-save draft failed:", err);
    }
  };

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleStep1Next = async (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, step1: data }));
    await autoSaveDraft({ step1: data });
    setCurrentStep(2);
  };

  const handleStep2Next = async (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, step2: data }));
    await autoSaveDraft({ step2: data });
    setCurrentStep(3);
  };

  const handleStep3Next = async (data: Step3Data) => {
    setFormData((prev) => ({ ...prev, step3: data }));
    await autoSaveDraft({ step3: data });
    setCurrentStep(4);
  };

  const handleStep4Next = async (data: Step4Data) => {
    setFormData((prev) => ({ ...prev, step4: data }));
    await autoSaveDraft({ step4: data });
    setCurrentStep(5);
  };

  const handleStep5Next = async (data: Step5Data) => {
    setFormData((prev) => ({ ...prev, step5: data }));
    await autoSaveDraft({ step5: data });
    setCurrentStep(6);
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // ── Final submit ─────────────────────────────────────────────────────────

  const handleSubmitForReview = async (payload: ProgramDBPayload) => {
    setSubmitError(null);
    try {
      const currentDraftId = loadDraftId();

      if (currentDraftId) {
        const res = await fetch("/api/mini-mastery-programs", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            id: currentDraftId,
            ...buildPartialPayload(formData),
            status: "UNDER_REVIEW",
            isComplete: true,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string })?.message || `Server error: ${res.status}`);
        }
      } else {
        const res = await fetch("/api/mini-mastery-programs", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string })?.message || `Server error: ${res.status}`);
        }
      }

      clearStorage();
      setDraftId(null);
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
      const currentDraftId = loadDraftId();

      if (currentDraftId) {
        const res = await fetch("/api/mini-mastery-programs", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            id: currentDraftId,
            ...buildPartialPayload(formData),
            status: "DRAFT",
            isComplete: true,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string })?.message || `Server error: ${res.status}`);
        }
      } else {
        const res = await fetch("/api/mini-mastery-programs?draft=true", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ ...payload, status: "DRAFT" }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string })?.message || `Server error: ${res.status}`);
        }
      }

      clearStorage();
      setDraftId(null);
      toast.success("Draft saved successfully!");
      router.push("/dashboard/mini-mastery-programs/create");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save draft. Please try again.";
      setSubmitError(message);
      throw err;
    }
  };

  // ── Guard ─────────────────────────────────────────────────────────────────

  const isFormComplete =
    !!formData.step1 && !!formData.step2 &&
    !!formData.step3 && !!formData.step4 && !!formData.step5;

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-8">
      {/* Progress Header */}
      <div className="w-full max-w-8xl mb-10">
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              STEP {currentStep} OF {TOTAL_STEPS}
            </span>
            <h3 className="text-gray-900 font-bold text-sm mt-1">
              {STEP_INFO[currentStep - 1]?.label}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {draftId && (
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                ✓ Auto-saved
              </span>
            )}
            <span className="text-blue-600 font-bold text-sm">{progress}%</span>
          </div>
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
        <div className="w-full max-w-8xl mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-6 py-4 rounded-2xl">
          {submitError}
        </div>
      )}

      {/* Form Card */}
      <div className="w-full max-w-8xl bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-10 md:p-16 min-h-[500px]">
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
            programTitle={formData.step1?.title}
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