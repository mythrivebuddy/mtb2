// @/types/client/mini-mastery-program.ts
import { z } from "zod";

// ─── Step 1: Program Basics ───────────────────────────────────────────────────
export const step1Schema = z.object({
  title: z
    .string()
    .min(5, "Program title must be at least 5 characters")
    .max(100, "Program title cannot exceed 100 characters"),
  subtitle: z
    .string()
    .min(10, "Transformation promise must be at least 10 characters")
    .max(300, "Transformation promise cannot exceed 300 characters"),
  duration: z.enum(["7 Days", "14 Days", "21 Days", "30 Days"], {
    errorMap: () => ({ message: "Please select a valid duration" }),
  }),
  unlockType: z.enum(["daily", "all"], {
    errorMap: () => ({ message: "Please select an unlock type" }),
  }),
});

export type Step1Data = z.infer<typeof step1Schema>;

// ─── Step 2: Achievements ─────────────────────────────────────────────────────
export const step2Schema = z.object({
  achievements: z
    .array(
      z.string().min(5, "Each achievement must be at least 5 characters")
    )
    .min(1, "Add at least one achievement")
    .max(10, "You can add a maximum of 10 achievements")
    .refine((arr) => arr.every((a) => a.trim().length > 0), {
      message: "Achievements cannot be empty",
    }),
});

export type Step2Data = z.infer<typeof step2Schema>;

// ─── Step 3: Module Builder ───────────────────────────────────────────────────
export const moduleSchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(3, "Module title must be at least 3 characters")
    .max(100, "Module title cannot exceed 100 characters"),
  type: z.enum(["video", "text"], {
    errorMap: () => ({ message: "Please select a content type" }),
  }),
  videoUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(2000, "Instructions cannot exceed 2000 characters"),
  actionTask: z
    .string()
    .min(5, "Action task must be at least 5 characters")
    .max(500, "Action task cannot exceed 500 characters"),
});

export const step3Schema = z
  .object({
    modules: z
      .array(moduleSchema)
      .min(1, "You must have at least 1 module"),
  })
  .superRefine((data, ctx) => {
    data.modules.forEach((mod, i) => {
      if (mod.type === "video" && (!mod.videoUrl || mod.videoUrl.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Video URL is required for video modules",
          path: [`modules`, i, "videoUrl"],
        });
      }
    });
  });

export type Module = z.infer<typeof moduleSchema>;
export type Step3Data = z.infer<typeof step3Schema>;

// ─── Step 4: Pricing ──────────────────────────────────────────────────────────
export const step4Schema = z
  .object({
    isPaid: z.boolean(),
    currency: z.enum(["INR", "USD"]),
    price: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.isPaid) {
      const numPrice = parseFloat(data.price);
      if (!data.price || isNaN(numPrice)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid price",
          path: ["price"],
        });
      } else if (numPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be greater than 0 for paid programs",
          path: ["price"],
        });
      } else if (data.currency === "INR" && numPrice < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum price for INR is ₹10",
          path: ["price"],
        });
      } else if (data.currency === "USD" && numPrice < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum price for USD is $1",
          path: ["price"],
        });
      }
    }
  });

export type Step4Data = z.infer<typeof step4Schema>;

// ─── Step 5: Completion & Certificate ────────────────────────────────────────
export const step5Schema = z.object({
  threshold: z
    .number()
    .min(50, "Completion threshold must be at least 50%")
    .max(100, "Completion threshold cannot exceed 100%"),
  certTitle: z
    .string()
    .min(5, "Certificate title must be at least 5 characters")
    .max(150, "Certificate title cannot exceed 150 characters"),
});

export type Step5Data = z.infer<typeof step5Schema>;

// ─── Full Program (for DB save on Step 6) ────────────────────────────────────
export interface FullProgramPayload {
  // From Step 1
  name: string;         // = title
  slug: string;         // auto-generated from title
  description: string;  // = subtitle
  durationDays: number; // parsed from "7 Days" => 7
  unlockType: string;

  // From Step 2
  achievements: string[];

  // From Step 3
  modules: Module[];

  // From Step 4
  price: number;
  currency: string;

  // From Step 5
  completionThreshold: number;
  certificateTitle: string;

  // Default
  status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED";
}