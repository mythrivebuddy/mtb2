import { z } from "zod";

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
  mood: z.string().min(1, 'Please select a mood'),
  tasks: z
    .array(
      z
        .string()
        .min(1, 'Please enter a task')
        .max(120, 'Each task must be less than or equal to 120 characters')
    )
    .length(3, 'Exactly three tasks are required'),
});


export const step2Schema = z.object({
  selectedTask: z.string().min(1, 'Please select a task'),
  categories: z.array(z.enum(['Creative', 'Revenue Generating', 'Nurturing', 'Admin'])).optional(),
  emoji: z.string().min(1, 'Please select an emoji'),
  emojiCategory: z.string().min(1, 'Please select an emoji category'),
});

export const step3Schema = z.object({
  fromTime: z.string().min(1, 'Please select a time'),
  toTime: z.string().min(1, 'Please select a time'),
});

export const step4Schema = z.object({
  content: z.string().min(1, 'Please select a time'),

});

// Buddy-lends request form schema

export const buddyLensRequestSchema = z.object({
  socialMediaUrl: z
    .string()
    .url('Invalid URL')
    .min(1, 'Social Media URL is required'),
  tier: z.enum(['5min', '10min', '15min']),
  domain: z.string().min(1, 'Domain is required'),
  questions: z
    .array(z.string().min(1, 'Question cannot be empty'))
    .min(1, 'At least one question is required')
    .max(3, 'Maximum of 3 questions allowed'),
  jpCost: z.number({ required_error: "JoyPearls Cost is required" }),
});

// Profile Schema
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").min(10, "Bio must be at least 10 characters"),
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

