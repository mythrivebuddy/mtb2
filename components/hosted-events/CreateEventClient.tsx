"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/lib/new-home/theme/theme";
import { ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Stepper from "../ui/mtb/stepper";

export default function CreateEventClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [step, setStep] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const { data } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const res = await axios.get(`/api/hosted-events/${eventId}`);
      return res.data;
    },
    enabled: !!eventId,
  });
  const steps = ["Basic Info", "Format & Location", "Schedule"];

  const nextStep = () => {
    if (step < steps.length) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (eventId) return; // already has an id in URL, do nothing
    const savedId = localStorage.getItem("create-event-draft-id");
    if (savedId) {
      router.replace(`?eventId=${savedId}`, { scroll: false });
    }
  }, []);

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
    <div className="min-h-screen flex w-full flex-col">
      <div ref={topRef} />

      {/* 🔥 STEPPER */}
      <div className="sm:px-12">
        <Stepper steps={steps} currentStep={step} onStepClick={setStep} />
      </div>

      {/* 🔥 STEP CONTENT */}
      <div className="flex-1">
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
            isDraft={isDraft}
            setIsDraft={setIsDraft}
            setIsDraftLoading={setIsDraftLoading}
          />
        )}
        {step === 3 && (
          <Step3
            onNext={nextStep}
            setIsLoading={setIsLoading}
            eventData={data}
            eventId={eventId}
            isDraft={isDraft}
            setIsDraft={setIsDraft}
            setIsDraftLoading={setIsDraftLoading}
          />
        )}
        {/* step 4 is legacy we will remove this  */}
        {step === 4 && (
          <Step4
            onNext={nextStep}
            setIsLoading={setIsLoading}
            eventData={data}
            eventId={eventId}
            isDraft={isDraft}
            setIsDraft={setIsDraft}
            setIsDraftLoading={setIsDraftLoading}
          />
        )}
      </div>

      {/* 🔥 FOOTER */}
      <footer className={`${theme.footer} mx-4 py-4 z-40`}>
        <div className="mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between">
          {/* Left */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (step === 1) {
                document
                  .getElementById("step1-form")
                  ?.dispatchEvent(
                    new CustomEvent("back-request", { bubbles: true }),
                  );
              } else {
                prevStep();
              }
            }}
            className={`max-sm:w-full max-sm:justify-center px-4 sm:px-6 order-2 sm:order-1 flex items-center gap-2 py-3 rounded-full border border-black  text-sm font-medium hover:opacity-80 transition-all`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Right */}
          <div className="max-sm:w-full flex flex-col sm:flex-row  order-1 sm:order-2 items-center gap-6">
            <p className=" text-xs opacity-70">
              Step {step} of {steps.length}
            </p>

            <button
              // onClick={nextStep}
              form={`step${step}-form`}
              disabled={isLoading || isDraftLoading}
              className={`max-sm:w-full flex items-center max-sm:justify-center px-6 py-3 rounded-full ${theme.buttonDark} text-sm font-medium shadow-md hover:opacity-90 active:scale-95 transition-all  gap-2`}
            >
              {step === 3 ? (
                <>
                  <Rocket className="w-4 h-4" />
                  {isLoading ? "Publishing..." : "Publish"}
                </>
              ) : (
                <>
                  {isLoading ? "Saving..." : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
