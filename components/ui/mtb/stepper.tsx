"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

import { theme } from "@/lib/new-home/theme/theme";
import { cn } from "@/lib/utils/utils";

export type StepItem =
  | string
  | { label: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode };

const stepperVariants = cva("flex w-full", {
  variants: {
    variant: {
      horizontal: "items-center justify-center",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    variant: "horizontal",
  },
});

export interface StepperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepperVariants> {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  allowClickAhead?: boolean;
  readOnly?: boolean;
  containerClassName?: string;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      currentStep,
      onStepClick,
      allowClickAhead = false,
      readOnly = false,
      variant,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const isVertical = variant === "vertical";

    return (
      <div
        ref={ref}
        className={cn("w-full px-4 sm:px-0 pt-4 pb-4", className)}
        {...props}
      >
        <div
          className={cn(stepperVariants({ variant, className: containerClassName }))}
        >
          {steps.map((step, index) => {
            const label = typeof step === "string" ? step : step.label;
            const description = typeof step === "string" ? null : step.description;
            const icon = typeof step === "string" ? null : step.icon;

            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            const isLast = index === steps.length - 1;

            // If readOnly is true, we want everything to look active visually
            const isVisualActive = readOnly || isActive || isCompleted;

            const isClickable =
              !readOnly &&
              onStepClick &&
              (allowClickAhead || stepNumber <= currentStep);

            return (
              <div
                key={index}
                className={cn(
                  // CSS GRID is the secret here. It forces the left col (circles) 
                  // to perfectly match the height of the right col (text).
                  isVertical
                    ? "grid grid-cols-[max-content_1fr] gap-x-4 w-full items-stretch"
                    : cn("flex items-center", !isLast ? "flex-1" : "")
                )}
              >
                {isVertical ? (
                  /* ============================
                     VERTICAL LAYOUT
                     ============================ */
                  <>
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isClickable && onStepClick) onStepClick(stepNumber);
                        }}
                        disabled={!isClickable}
                        className={cn(
                          theme.stepperCircleBase,
                          isVisualActive
                            ? theme.stepperCircleActive
                            : theme.stepperCircleInactive,
                          readOnly
                            ? "cursor-default"
                            : !isClickable
                            ? "cursor-default opacity-50"
                            : "cursor-pointer hover:opacity-90 transition-opacity"
                        )}
                      >
                        {isCompleted && !readOnly ? (
                          <Check className="w-5 h-5" strokeWidth={3} />
                        ) : icon ? (
                          icon
                        ) : (
                          stepNumber
                        )}
                      </button>

                 
                        <div
                          className={cn(
                            theme.stepperLineVertical,
                            "w-[2px] flex-1",
                            isVisualActive ? "opacity-100" : "opacity-50"
                          )}
                          // Inline styles act as an absolute override guaranteeing 
                          // it grows vertically, even if theme files say otherwise.
                          style={{ flexGrow: 1, height: "auto", minHeight: "48px" }}
                        />
                 
                    </div>

                    <div className={cn("flex flex-col justify-start pt-1 w-full", !isLast && "pb-12")}>
                      <div
                        className={cn(
                          isVisualActive
                            ? theme.stepperLabelActive
                            : theme.stepperLabelInactive
                        )}
                      >
                        {label}
                      </div>
                      {description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {description}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* ============================
                     HORIZONTAL LAYOUT
                     ============================ */
                  <>
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isClickable && onStepClick) onStepClick(stepNumber);
                        }}
                        disabled={!isClickable}
                        className={cn(
                          theme.stepperCircleBase,
                          isVisualActive
                            ? theme.stepperCircleActive
                            : theme.stepperCircleInactive,
                          readOnly
                            ? "cursor-default"
                            : !isClickable
                            ? "cursor-default opacity-50"
                            : "cursor-pointer hover:opacity-90 transition-opacity"
                        )}
                      >
                        {isCompleted && !readOnly ? (
                          <Check className="w-5 h-5" strokeWidth={3} />
                        ) : icon ? (
                          icon
                        ) : (
                          stepNumber
                        )}
                      </button>

                      <div className="flex flex-col items-center text-center whitespace-nowrap">
                        <div
                          className={cn(
                            isVisualActive
                              ? theme.stepperLabelActive
                              : theme.stepperLabelInactive
                          )}
                        >
                          {label}
                        </div>
                        {description && (
                          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                            {description}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isLast && (
                      <div
                        className={cn(
                          theme.stepperLine,
                          "justify-self-center self-start mt-[18px] h-[2px] min-w-[15px] max-sm:max-w-[15px]",
                       
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Stepper.displayName = "Stepper";

export default Stepper;