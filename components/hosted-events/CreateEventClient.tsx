"use client";

import { useState } from "react";
import { theme } from "@/lib/new-home/theme/theme";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";

export default function CreateEventClient() {
  const [step, setStep] = useState(1);

  const steps = ["Basic Info", "Format & Location", "Schedule", "Publish"];

  const nextStep = () => {
    if (step < steps.length) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 🔥 HEADER */}
      <header className="flex items-center gap-4 px-6 py-4">
        {/* Back Button */}
        {step > 1 && (
          <button
            onClick={prevStep}
            className={`transition-colors hover:${theme.textAccent}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        <h2 className={`${theme.typography.h1} text-xl`}>Create Event</h2>
      </header>

      {/* 🔥 STEPPER */}
      <div className="px-6 pt-4 pb-8  overflow-x-auto">
        <div className="flex items-center min-w-[800px]  ">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isCompleted = step > stepNumber;

            return (
              <div key={label} className="flex items-center flex-1">
                {/* Circle + Label */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      if (stepNumber <= step) {
                        setStep(stepNumber);
                      }
                    }}
                    className={`${theme.stepperCircleBase} ${
                      isActive
                        ? theme.stepperCircleActive
                        : isCompleted
                          ? theme.stepperCircleActive
                          : theme.stepperCircleInactive
                    }`}
                  >
                    {stepNumber}
                  </button>

                  <span
                    className={
                      isActive
                        ? theme.stepperLabelActive
                        : theme.stepperLabelInactive
                    }
                  >
                    {label}
                  </span>
                </div>

                {/* Line */}
                {index < steps.length - 1 && (
                  <div className={theme.stepperLine}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔥 STEP CONTENT */}
      <div className="flex-1">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
      </div>

      {/* 🔥 FOOTER */}
      <footer className={`${theme.footer} mx-6 py-4 z-40`}>
        <div className="mx-auto px-6 flex items-center justify-between">
          {/* Left */}
          <button
            className={`px-4 sm:px-8 py-3 rounded-full border ${theme.borderAccent} ${theme.textAccent} text-sm font-medium hover:opacity-80 transition-all`}
          >
            Save as Draft
          </button>

          {/* Right */}
          <div className="flex items-center gap-6">
            <p className="hidden sm:block text-xs opacity-70">
              Step {step} of {steps.length}
            </p>

            <button
              onClick={nextStep}
              className={`px-8 py-3 rounded-full ${theme.buttonDark} text-sm font-medium shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
