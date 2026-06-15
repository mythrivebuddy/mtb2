"use client";
//! This stepper i have used in the create event page
import { ReactNode } from "react";
import { theme } from "@/lib/new-home/theme/theme";
import { cn } from "@/lib/utils/utils";
import { Check } from "lucide-react";

export type StepItem =
  | string
  | { label: string; description?: string; icon?: ReactNode };

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  allowClickAhead?: boolean; // Defaults to false
  className?: string; // Override outer container styles
  containerClassName?: string; // Override the inner flex container
}

export default function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowClickAhead = false,
  className,
  containerClassName,
}: StepperProps) {
  return (
    <div className={cn("w-full px-4 sm:px-0 pt-4 pb-4 ", className)}>
      <div
        className={cn(
          "flex items-center justify-center w-full",

          containerClassName,
        )}
      >
        {steps.map((step, index) => {
          // Normalize the step data whether it's a string or an object
          const label = typeof step === "string" ? step : step.label;
          const description =
            typeof step === "string" ? null : step.description;
          const icon = typeof step === "string" ? null : step.icon;

          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;

          // Determine if this specific step is clickable
          const isClickable =
            onStepClick && (allowClickAhead || stepNumber <= currentStep);

          return (
            <div
              key={label}
              className={cn(
                "flex items-center",
                index < steps.length - 1 ? "flex-1 " : "",
              )}
            >
              {/* Circle + Label */}
              <div className="flex flex-col items-center gap-3  shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isClickable) onStepClick(stepNumber);
                  }}
                  disabled={!isClickable}
                  className={cn(
                    theme.stepperCircleBase,
                    isActive || isCompleted
                      ? theme.stepperCircleActive
                      : theme.stepperCircleInactive,
                    !isClickable
                      ? "cursor-default opacity-50"
                      : "cursor-pointer hover:opacity-90 transition-opacity",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : icon ? (
                    icon
                  ) : (
                    stepNumber
                  )}
                </button>

                <div className="flex flex-col items-center text-center whitespace-nowrap">
                  <span
                    className={cn(
                      isActive || isCompleted
                        ? theme.stepperLabelActive
                        : theme.stepperLabelInactive,
                      "",
                    )}
                  >
                    {label}
                  </span>
                  {description && (
                    <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                      {description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    theme.stepperLine,
                    "justify-self-center self-start mt-[18px] h-[2px] min-w-[10px] ",
                  )}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
