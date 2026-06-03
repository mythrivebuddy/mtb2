"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/lib/new-home/theme/theme";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function CreateEventClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const { data } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const res = await axios.get(`/api/hosted-events/${eventId}`);
      return res.data;
    },
    enabled: !!eventId,
  });
  const steps = ["Basic Info", "Format & Location", "Schedule", "Publish"];

  const nextStep = () => {
    if (step < steps.length) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      topRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120); // sweet spot

    return () => clearTimeout(timeout);
  }, [step]);
  return (
    <div  className="min-h-screen flex flex-col">
     <div ref={topRef} />
      {/* 🔥 HEADER */}
      <header className="flex items-center gap-4 px-6 py-4">
        {/* Back Button */}
        {/* {step > 1 && ( */}
          <button
           onClick={() => (step > 1 ? prevStep() : router.back())}
            className={`transition-colors hover:${theme.textAccent}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        {/* )} */}

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
      <div  className="flex-1">
        {step === 1 && (
          <Step1
            onNext={nextStep}
            setIsLoading={setIsLoading}
            eventData={data}
            eventId={eventId}
          />
        )}
        {step === 2 && (
          <Step2
            onNext={nextStep}
            setIsLoading={setIsLoading}
            eventData={data}
            eventId={eventId}
          />
        )}
        {step === 3 && (
          <Step3
            onNext={nextStep}
            setIsLoading={setIsLoading}
            eventData={data}
            eventId={eventId}
          />
        )}
        {step === 4 && (
          <Step4
            onNext={nextStep}
            setIsLoading={setIsLoading}
            eventData={data}
            eventId={eventId}
          />
        )}
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
              // onClick={nextStep}
              form={`step${step}-form`}
              disabled={isLoading}
              className={`px-8 py-3 rounded-full ${theme.buttonDark} text-sm font-medium shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2`}
            >
              {isLoading ? "Saving..." : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
