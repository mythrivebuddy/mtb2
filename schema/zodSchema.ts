import { z } from "zod";

const PASS_LENGTH = 8;

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

// Types
export const prosperitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

export type ProsperityFormType = z.infer<typeof prosperitySchema>;

export type SignupFormType = z.infer<typeof signupSchema>;
export type SigninFormType = z.infer<typeof signinSchema>;
export type MiracleLogFormType = z.infer<typeof miracleLogSchema>;
