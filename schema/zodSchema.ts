import { z } from "zod";
import { ChallengeMode } from "@prisma/client";

const PASS_LENGTH = 8;

// Base signup schema
const baseSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(PASS_LENGTH, `Password must be at least ${PASS_LENGTH} characters`),
  confirmPassword: z
    .string()
    .min(PASS_LENGTH, "Confirm Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  referralCode: z.string().optional(),
});

// Full signup schema with password match validation
export const signupSchema = baseSignupSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

// Signin Schema (omit name and confirmPassword from the signup schema)
export const signinSchema = baseSignupSchema
  .omit({ name: true, confirmPassword: true })
  .extend({
    rememberMe: z.boolean().default(false),
  });

// Miracle Log Schema
export const miracleLogSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(120, "Content cannot exceed 120 characters"),
});

// --- UPDATED SCHEMA ---
export const dailyBloomSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(50, "Title cannot exceed 50 characters"),
    description: z.string().nullable(),
    dueDate: z.preprocess(
      (arg) => {
        if (typeof arg === "string" && arg.length > 0) {
          const date = new Date(arg);
          return isNaN(date.getTime()) ? undefined : date;
        }
        if (arg instanceof Date) {
          return arg;
        }
        return undefined;
      },
      z.date().optional().nullable()
    ),
    frequency: z.enum(["Daily", "Weekly", "Monthly"]).optional().nullable(),
    isCompleted: z.boolean().default(false),
    taskAddJP: z.boolean().default(false),
    taskCompleteJP: z.boolean().default(false),
    isFromEvent: z.boolean().optional(),

    // --- NEW FIELDS FOR CALENDAR INTEGRATION ---
    addToCalendar: z.boolean().optional(),
    startTime: z.string().optional(), // Storing as string e.g., "14:30"
    endTime: z.string().optional(),   // Storing as string e.g., "16:00"
  })
  .superRefine((data, ctx) => {
    // Rule 1: Ensure EITHER a dueDate OR a frequency is selected, but not both.
    const isOnlyOneSelected = !!data.dueDate !== !!data.frequency;
    if (!isOnlyOneSelected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select either a Due Date or a Frequency, but not both.",
        path: ["dueDate"],
      });
    }

    // Rule 2: If user wants to add to calendar, validate related fields.
    if (data.addToCalendar) {
      // It must have a due date to be added to the calendar
      if (!data.dueDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A due date is required to add an event to the calendar.",
            path: ["addToCalendar"],
        });
      }
      // Start time becomes required
      if (!data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start time is required to add to calendar.",
          path: ["startTime"],
        });
      }
      // End time becomes required
      if (!data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time is required to add to calendar.",
          path: ["endTime"],
        });
      }
      // End time must be after start time
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time.",
          path: ["endTime"],
        });
      }
    }
  });
// --- END OF UPDATE ---


export const challengeSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    mode: z.nativeEnum(ChallengeMode),
    cost: z.number(),
    reward: z.number(),
    penalty: z.number(),

    startDate: z.coerce.date().refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
      },
      {
        message: "Start date must be in the future.",
      }
    ),

    endDate: z.coerce.date(),

    tasks: z
      .array(
        z.object({
          description: z.string().min(1, "Task description is required"),
        })
      )
      .min(1, "At least 1 task is required")
      .max(3, "No more than 3 tasks are allowed"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"],
  });

// Miracle Log Schema
export const progressvaultSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(120, "Content cannot exceed 120 characters"),
});

// Types
export const prosperitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

export const step1Schema = z.object({
  mood: z.string().min(1, "Please select a mood"),
  tasks: z
    .array(
      z
        .string()
        .min(1, "Please enter a task")
        .max(120, "Each task must be less than or equal to 120 characters")
    )
    .length(3, "Exactly three tasks are required"),
});

export const step2Schema = z.object({
  selectedTask: z.string().min(1, "Please select a task"),
  categories: z
    .array(z.enum(["Creative", "Revenue Generating", "Nurturing", "Admin"]))
    .optional(),
  emoji: z.string().min(1, "Please select an emoji"),
  emojiCategory: z.string().min(1, "Please select an emoji category"),
});

export const step3Schema = z.object({
  fromTime: z.string().min(1, "Please select a time"),
  toTime: z.string().min(1, "Please select a time"),
});

export const step4Schema = z.object({
  content: z.string().min(1, "Please select a time"),
});

// Buddy-lends request form schema

export const buddyLensRequestSchema = z.object({
  socialMediaUrl: z
    .string()
    .url("Invalid URL")
    .min(1, "Social Media URL is required"),
  tier: z.enum(["5min", "10min", "15min"]),
  domain: z.string().min(1, "Domain is required"),
  questions: z
    .array(z.string().min(1, "Question cannot be empty"))
    .min(1, "At least one question is required")
    .max(3, "Maximum of 3 questions allowed"),
  jpCost: z.number({ required_error: "JoyPearls Cost is required" }),
});

// Profile Schema
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .min(10, "Bio must be at least 10 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const magicBoxSettingsSchema = z
  .object({
    minJpAmount: z.number().min(1).max(1000),
    maxJpAmount: z.number().min(1).max(1000),
  })
  .refine((d) => d.minJpAmount <= d.maxJpAmount, {
    message: "minJpAmount cannot be greater than maxJpAmount",
    path: ["minJpAmount"],
  });

export const activitySchema = z.object({
  activityId: z.string().min(1, "Activity is required"),
  // jpAmount: z.string().min(1, "JP amount is required"),
  jpAmount: z.string(),
});

export const contactFormSchems = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactForm = z.infer<typeof contactFormSchems>;
export type ActivityFormValues = z.infer<typeof activitySchema>;
export type MagicBoxSettings = z.infer<typeof magicBoxSettingsSchema>;
export type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;
export type BuddyLensRequestInputs = z.infer<typeof buddyLensRequestSchema>;
export type forgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;
export type ProsperityFormType = z.infer<typeof prosperitySchema>;
export type SignupFormType = z.infer<typeof signupSchema>;
export type SigninFormType = z.infer<typeof signinSchema>;
export type MiracleLogFormType = z.infer<typeof miracleLogSchema>;
export type progressVaultFormType = z.infer<typeof progressvaultSchema>;
export type Step1FormType = z.infer<typeof step1Schema>;
export type Step2FormType = z.infer<typeof step2Schema>;
export type Step3FormType = z.infer<typeof step3Schema>;
export type Step4FormType = z.infer<typeof step4Schema>;
export type buddyLensRequestSchema = z.infer<typeof buddyLensRequestSchema>;
export type ProfileFormType = z.infer<typeof profileSchema>;
export type DailyBloomFormType = z.infer<typeof dailyBloomSchema>;
export type challengeSchemaFormType = z.infer<typeof challengeSchema>;