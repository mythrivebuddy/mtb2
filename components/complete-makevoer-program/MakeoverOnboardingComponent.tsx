"use client";

import { useState, useMemo, Fragment, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { Leaf, type LucideIcon } from "lucide-react";
import { AREA_ICON_MAP } from "@/lib/utils/makeover-program/makeover-icons";

import Step1ThriveAreas from "./onboarding-five-steps/Step1ThriveAreas";
import StepTwoGoals from "./onboarding-five-steps/StepTwoGoals";
import Step3IdentitySelection from "./onboarding-five-steps/Step3IdentitySelection";
import Step4UnifiedVision from "./onboarding-five-steps/Step4UnifiedVision";
import Step5VisionSummary from "./onboarding-five-steps/Step5VisionSummary";
import Step6ProgramRules from "./onboarding-five-steps/Step6ProgramRules";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";

/* ───────────── TYPES ───────────── */

type ApiArea = {
  id: number;
  name: string;
  description?: string | null;
};

type ApiGoal = {
  areaId: number;
  title: string;
};

type ApiIdentity = {
  areaId: number;
  statement: string;
};

type NormalizedArea = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type FormState = {
  selectedAreas: string[];
  areaGoals: Record<string, string>;
  identities: Record<string, string>;
  vision: string;
};
type InitialOnboardingData = {
  programId?: string;
  onboarded: boolean;
  selectedAreas: string[];
  areaGoals: Record<string, string>;
  identities: Record<string, string>;
  vision: string;
  visionImageUrl?: string;
} | null;
type FormOptionsResponse = {
  areas: ApiArea[];
  goals: ApiGoal[];
  identities: ApiIdentity[];
};

const MakeoverOnboardingParent = ({
  initialData,
  formOptions,
}: {
  initialData: InitialOnboardingData;
  formOptions: FormOptionsResponse;
}) => {
  const isEditMode = initialData?.onboarded === true;
  const router = useRouter();

  const [step, setStep] = useState<number>(isEditMode ? 2 : 1);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [step]);

  /* ───────────── NORMALIZATION ───────────── */

  const areas = useMemo<NormalizedArea[]>(() => {
    return formOptions.areas.map((a) => ({
      id: String(a.id),
      title: a.name,
      description: a.description ?? "",
      icon: (AREA_ICON_MAP[a.id] ?? Leaf) as LucideIcon,
    }));
  }, [formOptions.areas]);

  const goalsByArea = useMemo<Record<string, string[]>>(() => {
    return formOptions.goals.reduce(
      (acc, g) => {
        const key = String(g.areaId);
        acc[key] ??= [];
        acc[key].push(g.title);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [formOptions.goals]);

  const identitiesByArea = useMemo<Record<string, string[]>>(() => {
    return formOptions.identities.reduce(
      (acc, i) => {
        const key = String(i.areaId);
        acc[key] ??= [];
        acc[key].push(i.statement);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [formOptions.identities]);

  /* ───────────── FORM STATE ───────────── */
  const [formData, setFormData] = useState<FormState>({
    selectedAreas: initialData?.selectedAreas ?? [],
    areaGoals: initialData?.areaGoals ?? {},
    identities: initialData?.identities ?? {},
    vision: initialData?.vision ?? "",
  });

  /* ───────────── SUBMIT MUTATION ───────────── */
  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        areas: formData.selectedAreas.map(Number),

        goals: Object.entries(formData.areaGoals).map(([areaId, text]) => ({
          areaId: Number(areaId),
          customText: text,
        })),

        identities: Object.entries(formData.identities).map(
          ([areaId, text]) => ({
            areaId: Number(areaId),
            customText: text,
          })
        ),

        dailyActions: [],
        visionStatement: formData.vision,
      };

      return axios.post("/api/makeover-program/onboarding", payload);
    },

    onSuccess: (res) => {
      const mode = res.data?.mode;

      if (mode === "edited") {
        toast.success("Changes saved successfully");
      } else {
        toast.success("🎉 Makeover Program onboarding completed!");
        console.log("ENROLL PAYLOAD", {
          programId: initialData?.programId,
          areaIds: formData.selectedAreas,
        });

        axios
          .post("/api/makeover-program/onboarding/enroll", {
            programId: initialData?.programId,
            areaIds: formData.selectedAreas.map(Number),
          })
          .catch((error) => {
            toast.error("Some challenges may take time to appear");
            console.error(
              "Error enrolling user into challenges after onboarding ",
              error
            );
          });
      }

      router.push("/dashboard/complete-makeover-program/makeover-dashboard");
    },

    onError: (err: AxiosError<{ error?: string }>) => {
      toast.error(
        err.response?.data?.error ?? "Something went wrong. Try again."
      );
    },
  });

  const nextStep = () => setStep((p) => p + 1);
  const prevStep = () => setStep((p) => p - 1);

  const STEP_LABELS = [
    "Makeover Areas",
    "Goals",
    "Identity",
    "Vision",
    "Summary",
    "Rules",
  ];

  const handleBreadcrumbClick = (targetStep: number) => {
    if (isEditMode && targetStep === 1) return; // block step 1 in edit mode
    setStep(targetStep);
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div ref={containerRef} />

      {/* ───────────── Breadcrumbs ───────────── */}
      <div className="flex flex-col items-start">
        <div className="px-4 py-4 sm:px-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="text-muted-foreground pointer-events-none">
                  Makeover Program
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              {STEP_LABELS.map((label, index) => {
                const currentStep = index + 1;
                if (currentStep > step) return null;

                const isCurrent = currentStep === step;

                return (
                  <Fragment key={label}>
                    <BreadcrumbItem>
                      {isCurrent ? (
                        <BreadcrumbPage>
                          <span className="flex items-center gap-1">
                            {isEditMode && label === "Makeover Areas" && (
                              <span>🔒</span>
                            )}
                            {label}
                          </span>
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          onClick={() => handleBreadcrumbClick(currentStep)}
                          className={`cursor-pointer ${
                            isEditMode && currentStep === 1
                              ? "pointer-events-none opacity-60"
                              : ""
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {isEditMode && label === "Makeover Areas" && (
                              <span>🔒</span>
                            )}
                            {label}
                          </span>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>

                    {!isCurrent && <BreadcrumbSeparator />}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {step === 1 && (
          <Step1ThriveAreas
            areas={areas}
            // isEditMode={isEditMode}
            // setStep={setStep}
            selectedIds={formData.selectedAreas}
            onUpdate={(ids) =>
              setFormData((p) => ({ ...p, selectedAreas: ids }))
            }
            onNext={nextStep}
          />
        )}

        {step === 2 && (
          <StepTwoGoals
            selectedAreas={formData.selectedAreas}
            areasMeta={areas}
            goalsByArea={goalsByArea}
            initialGoals={formData.areaGoals}
            onBack={prevStep}
            onNext={(goals: Record<string, string>) => {
              setFormData((p) => ({ ...p, areaGoals: goals }));
              nextStep();
            }}
          />
        )}

        {step === 3 && (
          <Step3IdentitySelection
            selectedAreas={formData.selectedAreas}
            areaGoals={formData.areaGoals}
            areasMeta={areas}
            identitiesByArea={identitiesByArea}
            initialIdentities={formData.identities}
            onBack={prevStep}
            onNext={(ids: Record<string, string>) => {
              setFormData((p) => ({ ...p, identities: ids }));
              nextStep();
            }}
          />
        )}

        {step === 4 && (
          <Step4UnifiedVision
            onBack={prevStep}
            initialVision={formData.vision}
            visionImageUrl={initialData?.visionImageUrl}
            onNext={(vision: string) => {
              setFormData((p) => ({ ...p, vision }));
              nextStep();
            }}
          />
        )}

        {step === 5 && (
          <Step5VisionSummary
            formData={formData}
            onBack={prevStep}
            onComplete={nextStep}
          />
        )}

        {step === 6 && (
          <Step6ProgramRules
            onBack={prevStep}
            onConfirm={() => submitMutation.mutate()}
            isSubmitting={submitMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default MakeoverOnboardingParent;
