"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HowToSchemaForm({ steps, setSteps }: any) {
  const addStep = () => {
    setSteps([...steps, { title: "", description: "" }]);
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4 mt-4">
      {steps.map((step: any, idx: number) => (
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
