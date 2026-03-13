"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

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
import { ProgramDBPayload } from "@/types/client/mini-mastery-program";

// ─── Step Info ────────────────────────────────────────────────────────────────

const STEP_INFO = [
  { label: "Program Basics",           next: "Content Structure"      },
  { label: "MMP Creation Flow",         next: "Module Builder"         },
  { label: "Daily Module Builder",      next: "Pricing Strategy"       },
  { label: "Pricing Strategy",          next: "Completion & Certificate" },
  { label: "Completion & Certificate",  next: "Review & Publish"       },
  { label: "Review & Publish",          next: "Finish"                 },
] as const;

const TOTAL_STEPS = 6;

// ─── Raw program shape returned by GET /api/mini-mastery-programs/[id] ────────

interface RawProgram {
  id:                  string;
  name:                string;
  description:         string | null;
  durationDays:        number | null;
  unlockType:          string | null;
  achievements:        unknown;
  modules:             unknown;
  price:               number | null;
  currency:            string | null;
  completionThreshold: number | null;
  certificateTitle:    string | null;
  thumbnailUrl:        string | null;
  status:              string | null;
}

// ─── Map raw DB program → FullFormData steps ──────────────────────────────────

// duration stored in DB as number (7,14,21,30) → map back to enum string
function toDurationEnum(days: number | null): "7 Days" | "14 Days" | "21 Days" | "30 Days" {
  const map: Record<number, "7 Days" | "14 Days" | "21 Days" | "30 Days"> = {
    7: "7 Days", 14: "14 Days", 21: "21 Days", 30: "30 Days",
  };
  return map[days ?? 7] ?? "7 Days";
}

function buildPartialPayload(data: Partial<FullFormData>): Record<string, unknown> {
  return {
    ...(data.step1 && {
      name:        data.step1.title,
      description: data.step1.subtitle,
      durationDays: parseInt(data.step1.duration),
      unlockType:  data.step1.unlockType,
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

function mapProgramToFormData(p: RawProgram): Partial<FullFormData> {
  // DB stores achievements as string[] — step2 expects { value: string }[]
  const achievements = (Array.isArray(p.achievements) ? p.achievements as string[] : [])
    .map((a) => ({ value: typeof a === "string" ? a : (a as { value?: string }).value ?? "" }));

  const modules = Array.isArray(p.modules) ? p.modules : [];

  // DB stores price as number — step4 expects price as string + isPaid boolean
  const price  = p.price ?? 0;
  const isPaid = price > 0;

  return {
    step1: {
      title:        p.name,
      subtitle:     p.description ?? "",
      duration:     toDurationEnum(p.durationDays),
      unlockType:   (p.unlockType ?? "daily") as "daily" | "all",
      thumbnailUrl: p.thumbnailUrl ?? "",
    },
    step2: {
      achievements,
    },
    step3: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modules: modules as any,
    },
    step4: {
      isPaid,
      price:    String(price),
      currency: (p.currency ?? "INR") as "INR" | "USD",
    },
    step5: {
      threshold: p.completionThreshold ?? 80,
      certTitle: p.certificateTitle ?? "",
    },
  };
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const [currentStep, setCurrentStep] = useState(1);
  const [formData,    setFormData]    = useState<Partial<FullFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  // ── Auto-save on each step (PATCH existing program) ───────────────────────
const formDataRef = useRef<Partial<FullFormData>>({});

// formData update hone pe ref bhi sync karo
useEffect(() => {
  formDataRef.current = formData;
}, [formData]);

const autoSavePatch = async (newStepData: Partial<FullFormData>) => {
  if (!programId) return;
  try {
    // formData state stale ho sakti hai, isliye ref use karo
    const merged  = { ...formDataRef.current, ...newStepData };
    const partial = buildPartialPayload(merged);

    await fetch(`/api/mini-mastery-programs/${programId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...partial, status: "DRAFT" }),
    });
  } catch (err) {
    console.error("Auto-save patch failed:", err);
  }
};
  // ── Fetch existing program on mount ────────────────────────────────────────
  useEffect(() => {
    if (!programId) return;

    async function load() {
      try {
        const res = await fetch(`/api/mini-mastery-programs/${programId}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(d.message ?? `Error ${res.status}`);
        }
        const { program } = await res.json() as { program: RawProgram };
        setFormData(mapProgramToFormData(program));
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Could not load program.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [programId]);

  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleStep1Next = async (data: Step1Data) => { 
  setFormData((p) => ({ ...p, step1: data })); 
  await autoSavePatch({ step1: data });
  setCurrentStep(2); 
};
const handleStep2Next = async (data: Step2Data) => { 
  setFormData((p) => ({ ...p, step2: data })); 
  await autoSavePatch({ step2: data });
  setCurrentStep(3); 
};
const handleStep3Next = async (data: Step3Data) => { 
  setFormData((p) => ({ ...p, step3: data })); 
  await autoSavePatch({ step3: data });
  setCurrentStep(4); 
};
const handleStep4Next = async (data: Step4Data) => { 
  setFormData((p) => ({ ...p, step4: data })); 
  await autoSavePatch({ step4: data });
  setCurrentStep(5); 
};
const handleStep5Next = async (data: Step5Data) => { 
  setFormData((p) => ({ ...p, step5: data })); 
  await autoSavePatch({ step5: data });
  setCurrentStep(6); 
};
  const handleBack = () => setCurrentStep((p) => Math.max(p - 1, 1));

  // ── Submit: PUT → update program, auto-sets UNDER_REVIEW on backend ──────

  const handleSubmit = async (payload: ProgramDBPayload) => {
    setSubmitError(null);
    try {
      const res = await fetch(`/api/mini-mastery-programs/${programId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message ?? `Server error: ${res.status}`);
      }

      router.push("/dashboard/mini-mastery-programs/create");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setSubmitError(message);
      throw err;
    }
  };

  // Save draft still just calls PUT (keeps as UNDER_REVIEW — no separate draft on edit)
  const handleSaveDraft = async (payload: ProgramDBPayload) => {
    await handleSubmit(payload);
  };

  const isFormComplete =
    !!formData.step1 && !!formData.step2 && !!formData.step3 &&
    !!formData.step4 && !!formData.step5;

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 size={36} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading program…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-slate-600 font-bold text-sm max-w-xs">{fetchError}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Render form ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-10 px-4">

      {/* Progress Header */}
      <div className="w-full max-w-4xl mb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Editing Program — Step {currentStep} of {TOTAL_STEPS}
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

        {/* Info banner */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-medium text-amber-700">
          ⚠️ Saving changes will re-submit this program for admin review.
        </div>
      </div>

      {/* API Error Banner */}
      {submitError && (
        <div className="w-full max-w-4xl mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-6 py-4 rounded-2xl">
          {submitError}
        </div>
      )}

      {/* Form Card */}
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-10 md:p-16 min-h-[500px]">
        {currentStep === 1 && (
          <Step1ProgramBasics onNext={handleStep1Next} defaultValues={formData.step1} />
        )}
        {currentStep === 2 && (
          <Step2ProgramAchievements onNext={handleStep2Next} onBack={handleBack} defaultValues={formData.step2} />
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
          <Step4PricingStrategy onNext={handleStep4Next} onBack={handleBack} defaultValues={formData.step4} />
        )}
        {currentStep === 5 && (
          <Step5CompletionCertificate onNext={handleStep5Next} onBack={handleBack} defaultValues={formData.step5} programTitle={formData.step1?.title} />
        )}
        {currentStep === 6 && isFormComplete && (
          <Step6ReviewAndPublish
            formData={formData as FullFormData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
          />
        )}
      </div>
    </div>
  );
}