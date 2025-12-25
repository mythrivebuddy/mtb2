"use client";

import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { Leaf } from "lucide-react";
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

const MakeoverOnboardingParent = () => {
  const [step, setStep] = useState(1);

  /* ───────────── FETCH FORM OPTIONS ───────────── */
  const { data, isLoading } = useQuery({
    queryKey: ["makeover-formOptions"],
    queryFn: async () =>
      (await axios.get("/api/makeover-program/onboarding/form-options")).data,
  });

  /* ───────────── NORMALIZATION (CRITICAL FIX) ───────────── */

  const areas = useMemo(() => {
    if (!data?.areas) return [];

    return data.areas.map((a: any) => ({
      id: String(a.id),
      title: a.name,
      description: a.description ?? "",
      icon: AREA_ICON_MAP[a.id] ?? Leaf, // ✅ NEVER undefined
    }));
  }, [data]);

  const goalsByArea = useMemo(() => {
    if (!data?.goals) return {};

    return data.goals.reduce((acc: Record<string, string[]>, g: any) => {
      const key = String(g.areaId);
      acc[key] ??= [];
      acc[key].push(g.title);
      return acc;
    }, {});
  }, [data]);

  const identitiesByArea = useMemo(() => {
    if (!data?.identities) return {};

    return data.identities.reduce((acc: Record<string, string[]>, i: any) => {
      const key = String(i.areaId);
      acc[key] ??= [];
      acc[key].push(i.statement);
      return acc;
    }, {});
  }, [data]);

  /* ───────────── FORM STATE ───────────── */
  const [formData, setFormData] = useState({
    selectedAreas: [] as string[],
    areaGoals: {} as Record<string, string>,
    identities: {} as Record<string, string>,
    vision: "",
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

        dailyActions: [], // future step
        visionStatement: formData.vision,
      };

      return axios.post("/api/makeover-program/onboarding", payload);
    },

    onSuccess: () => {
      toast.success("🎉 Makeover Program onboarding completed!");
      // router.push("/dashboard");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ?? "Something went wrong. Try again."
      );
    },
  });

  const nextStep = () => setStep((p) => p + 1);
  const prevStep = () => setStep((p) => p - 1);

  const STEP_LABELS = [
    "Thrive Areas",
    "Goals",
    "Identity",
    "Vision",
    "Summary",
    "Rules",
  ];

  if (isLoading) return null;

  return (
    <div className="min-h-screen">
      {/* ───────────── Breadcrumbs ───────────── */}
      <div className="px-4 py-4 lg:px-52">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground">
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
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => setStep(currentStep)}
                        className="cursor-pointer"
                      >
                        {label}
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
          selectedIds={formData.selectedAreas}
          onUpdate={(ids) => setFormData((p) => ({ ...p, selectedAreas: ids }))}
          onNext={nextStep}
        />
      )}

      {step === 2 && (
        <StepTwoGoals
          selectedAreas={formData.selectedAreas}
          areasMeta={areas}
          goalsByArea={goalsByArea}
          onBack={prevStep}
          onNext={(goals) => {
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
          onBack={prevStep}
          onNext={(ids) => {
            setFormData((p) => ({ ...p, identities: ids }));
            nextStep();
          }}
        />
      )}

      {step === 4 && (
        <Step4UnifiedVision
          onBack={prevStep}
          onNext={(vision) => {
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
  );
};

export default MakeoverOnboardingParent;
