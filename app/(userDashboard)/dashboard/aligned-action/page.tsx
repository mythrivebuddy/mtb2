"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Step1 from "@/components/dashboard/user/aligned-action/Step1";
import Step2 from "@/components/dashboard/user/aligned-action/Step2";
import Step3 from "@/components/dashboard/user/aligned-action/Step3";
import Step4 from "@/components/dashboard/user/aligned-action/Step4";

// Create a client
const queryClient = new QueryClient();

export default function AlignedActionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Aligned Action</h1>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index + 1 <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1">Step {index + 1}</span>
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      index + 1 < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 1 && <Step1 onNext={goToNextStep} />}
          {currentStep === 2 && <Step2 onNext={goToNextStep} onBack={goToPrevStep} />}
          {currentStep === 3 && <Step3 onNext={goToNextStep} onBack={goToPrevStep} />}
          {currentStep === 4 && <Step4 onBack={goToPrevStep} />}
        </div>
      </div>
    </QueryClientProvider>
  );
}
