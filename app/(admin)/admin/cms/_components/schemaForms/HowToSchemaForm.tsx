"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HowToStepForm } from "@/types/types";

type HowToSchemaFormProps = {
  steps: HowToStepForm[];
  setSteps: React.Dispatch<React.SetStateAction<HowToStepForm[]>>;
};


export function HowToSchemaForm({ steps, setSteps }: HowToSchemaFormProps) {
  const addStep = () => {
    setSteps([...steps, { title: "", description: "" }]);
  };

    const updateStep = (
    index: number,
    field: keyof HowToStepForm,
    value: string
  ) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    );
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 mt-4">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className="border p-3 rounded-md space-y-3 bg-muted/40"
        >
          <div>
            <label className="font-medium">Step Title</label>
            <Input
              value={step.title}
              onChange={(e) => updateStep(idx, "title", e.target.value)}
            />
          </div>

          <div>
            <label className="font-medium">Description</label>
            <Input
              value={step.description}
              onChange={(e) => updateStep(idx, "description", e.target.value)}
            />
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeStep(idx)}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button type="button" onClick={addStep}>
        Add Step
      </Button>
    </div>
  );
}
