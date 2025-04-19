import { z } from "zod";

const PASS_LENGTH = 8;
const MIN_ACTIONS = 1;
const ACTION_ERROR = 'Action cannot be empty';
const MOOD_ERROR = 'Selecting a mood is required';
const ACTIONS_REQUIRED = `At least ${MIN_ACTIONS} actions are required`;
const MAX_ACTION_LENGTH = 120;
// Signup Schema
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(PASS_LENGTH, `Password must be at least ${PASS_LENGTH} characters`),
  name: z.string().min(2, "Name must be at least 2 characters"),
  referralCode: z.string().optional(),
});

// Signin Schema
export const signinSchema = signupSchema.omit({ name: true }).extend({
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

export const Step1FormType = z.object({
  step: z.number().min(1, "Step is required"),
  mood: z.string().min(1, MOOD_ERROR),
  actions: z
    .array(z.string().min(1, ACTION_ERROR).max(MAX_ACTION_LENGTH, `Action ${MAX_ACTION_LENGTH} characters se choti honi chahiye`))
    .min(MIN_ACTIONS, ACTIONS_REQUIRED),
});

export const Step2FormType = z.object({
  step: z.number().min(1, "Step is required"),
  category: z.string().min(1, "Category is required"),
});

export const Step3FormType = z.object({
  step: z.number().min(1, "Step is required"),
  content: z.string().min(1, "Content is required"),
});

export const Step4FormType = z.object({
  step: z.number().min(1, "Step is required"),
  content: z.string().min(1, "Content is required"),
});


export type ProsperityFormType = z.infer<typeof prosperitySchema>;
export type SignupFormType = z.infer<typeof signupSchema>;
export type SigninFormType = z.infer<typeof signinSchema>;
export type MiracleLogFormType = z.infer<typeof miracleLogSchema>;
export type Step1FormType = z.infer<typeof Step1FormType>;
export type Step2FormType = z.infer<typeof Step2FormType>;
export type progressVaultFormType = z.infer<typeof progressvaultSchema>;
