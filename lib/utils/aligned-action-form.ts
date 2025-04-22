import { z } from "zod";



// Step 1 Schema - Mood & Notes
export const step1Schema = z.object({
  mood: z.enum(["Sleepy", "Good To Go", "Motivated", "Highly Motivated"], {
    required_error: "Please select your mood",
  }),
  notes: z
    .array(
      z
        .string()
        .max(120, "Maximum 120 characters allowed")
        .optional()
    )
    .length(3, "Please provide all three notes"),
});

// Step 2 Schema - Task Type and Selection
export const step2Schema = z.object({
  taskTypes: z.array(
    z.enum(["create", "revenueGenerating", "nurturing", "admin"])
  ).min(1, "Select at least one task type"),
  selectedOption: z.string().min(1, "Please select one task").optional()
}).refine((data) => {
  // Make selectedOption required when submitting the form
  return data.selectedOption && data.selectedOption.trim().length > 0;
}, {
  message: "Please select one task",
  path: ["selectedOption"]
});

// Step 3 Schema - Time Selection
export const step3Schema = z.object({
  selectedTime: z
    .date()
    .refine(
      (date) => {
        const now = new Date();
        // Minimum time: 6 minutes from now (5 min for reminder + 1 min buffer)
        const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        return date >= sixMinutesFromNow && date <= oneHourFromNow;
      },
      {
        message: "Primary time must be at least 6 minutes from now (to allow for reminder emails)",
      }
    ),
  secondaryTime: z
    .date()
    .refine(
      (date) => {
        const now = new Date();
        const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        return date >= oneMinuteFromNow && date <= oneHourFromNow;
      },
      {
        message: "Secondary time must be between 1 minute from now and 1 hour from now",
      }
    ),
});

// Combined schema for the entire form
export const alignedActionSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
});

// Types derived from the schemas
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type AlignedActionFormData = z.infer<typeof alignedActionSchema>;

// Default values
export const defaultStep1Values: Step1Data = {
  mood: "" as Step1Data["mood"],
  notes: ["", "", ""],
};

export const defaultStep2Values: Step2Data = {
  taskTypes: [],
  selectedOption: ""
};

export const defaultStep3Values: Step3Data = {
  // Default to 7 minutes from now to ensure reminder email works
  selectedTime: new Date(new Date().getTime() + 7 * 60 * 1000),
  secondaryTime: new Date(new Date().getTime() + 10 * 60 * 1000),
};

export const getMoodEmoji = (mood: Step1Data["mood"]) => {
  switch (mood) {
    case "Sleepy":
      return "😴";
    case "Good To Go":
      return "😐";
    case "Motivated":
      return "😊";
    case "Highly Motivated":
      return "😄";
    default:
      return "";
  }
};