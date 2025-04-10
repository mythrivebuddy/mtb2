import { z } from "zod";
const PASS_LENGTH = 8;
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(PASS_LENGTH, `Password must be at least ${PASS_LENGTH} characters`),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const signinSchema = signupSchema.omit({ name: true }).extend({
  rememberMe: z.boolean().default(false),
});

export const prosperitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

export type ProsperityFormType = z.infer<typeof prosperitySchema>;

export type SigninFormType = z.infer<typeof signinSchema>;
export type SignupFormType = z.infer<typeof signupSchema>;
