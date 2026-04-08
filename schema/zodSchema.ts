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
  userType: z.enum(["enthusiast", "coach"], {
    required_error: "Kindly select one user type",
  }),
});

// Full signup schema with password match validation
export const signupSchema = baseSignupSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
);

// Signin Schema (omit name and confirmPassword from the signup schema)
export const signinSchema = baseSignupSchema
  .omit({ name: true, confirmPassword: true, userType: true })
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
    dueDate: z.preprocess((arg) => {
      if (typeof arg === "string" && arg.length > 0) {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? undefined : date;
      }
      if (arg instanceof Date) {
        return arg;
      }
      return undefined;
    }, z.date().optional().nullable()),
    frequency: z.enum(["Daily", "Weekly", "Monthly"]).optional().nullable(),
    isCompleted: z.boolean().default(false),
    taskAddJP: z.boolean().default(false),
    taskCompleteJP: z.boolean().default(false),
    isFromEvent: z.boolean().optional(),

    // --- NEW FIELDS FOR CALENDAR INTEGRATION ---
    addToCalendar: z.boolean().optional(),
    startTime: z.string().optional(), // Storing as string e.g., "14:30"
    endTime: z.string().optional(), // Storing as string e.g., "16:00"
  })
  .superRefine((data, ctx) => {
    // Rule 1: Ensure EITHER a dueDate OR a frequency is selected, but not both.
    const isOnlyOneSelected = !!data.dueDate !== !!data.frequency;
    if (!isOnlyOneSelected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Please select either a Due Date or a Frequency, but not both.",
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
      // if (!data.endTime) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: "End time is required to add to calendar.",
      //     path: ["endTime"],
      //   });
      // }
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
    challengeType: z.enum(["FREE", "PAID"]).default("FREE"),

    challengeJoiningFee: z.preprocess(
      (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
      z.number().min(1).optional(),
    ),
    challengeJoiningFeeCurrency: z.enum(["INR", "USD"]).optional(),
    cost: z.number(),
    reward: z.number(),
    penalty: z.number(),
    social_link_task: z.string().optional(),
    startDate: z.coerce.date().refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      {
        message: "Start date must be today or in the future.",
      },
    ),

    endDate: z.coerce.date(),
    isIssuingCertificate: z.boolean().default(false),
    creatorSignatureUrl: z.string().optional().nullable(),
    creatorSignatureText: z.string().optional().nullable(),

    tasks: z
      .array(
        z.object({
          description: z.string().min(1, "Task description is required"),
        }),
      )
      .min(1, "At least 1 task is required")
      .max(3, "No more than 3 tasks are allowed"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    if (data.challengeType === "PAID") {
      if (typeof data.challengeJoiningFee !== "number") {
        ctx.addIssue({
          path: ["challengeJoiningFee"],
          message: "Fee is required for paid challenges",
          code: z.ZodIssueCode.custom,
        });
      }

      if (!data.challengeJoiningFeeCurrency) {
        ctx.addIssue({
          path: ["challengeJoiningFeeCurrency"],
          message: "Currency is required for paid challenges",
          code: z.ZodIssueCode.custom,
        });
      }
    }
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
        .max(120, "Each task must be less than or equal to 120 characters"),
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

const testimonialSchema = z.object({
  name: z.string().min(2, "Client name is required"),

  role: z.string().min(2, "Client role is required"),

  content: z
    .string()
    .min(15, "Testimonial must be at least 15 characters")
    .max(500, "Maximum 500 characters"),
});
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
export const businessProfileSchema = z
  .object({
    /* ---------------- BASIC INFO ---------------- */

    name: z.string().min(2, "Name must be at least 2 characters"),

    tagline: z.string().min(10, "Tagline must be at least 10 characters"),

    /* ---------------- NICHE ---------------- */

    coachingDomains: z
      .array(z.string())
      .min(1, "Select at least one coaching domain"),

    targetAudience: z
      .array(z.string())
      .min(1, "Select at least one target audience"),

    /* ---------------- TRANSFORMATION ---------------- */

    transformation: z
      .string()
      .min(20, "Describe transformation (min 20 characters)"),

    typicalResults: z
      .array(z.string())
      .min(1, "Add at least one typical result"),

    /* ---------------- SESSION STYLE ---------------- */

    sessionStyles: z
      .array(z.string())
      .min(1, "Select at least one session style"),

    methodology: z
      .string()
      .min(20, "Describe your methodology (min 20 characters)")
      .max(500, "Maximum 500 characters allowed"),

    toolsFrameworks: z
      .string()
      .max(300, "Maximum 300 characters allowed")
      .optional(),

    /* ---------------- SERVICES ---------------- */

    servicesOffered: z.array(z.string()).min(1, "Select at least one service"),

    /* ---------------- SESSION & AVAILABILITY ---------------- */

    languages: z.array(z.string()).min(1, "Select at least one language"),

    timezone: z.string().min(1, "Please select your timezone"),

    sessionFormat: z.string().min(1, "Please select session format"),

    calendlyUrl: z
      .string()
      .min(1, "Discovery call booking link is required")
      .url("Please enter a valid URL")
      .refine(
        (val) => val.includes("calendly.com"),
        "Only Calendly links are accepted (e.g. https://calendly.com/your-name)",
      ),
    preferredCurrency: z.enum(["INR", "USD"], {
      required_error: "Please select a currency",
      invalid_type_error: "Please select a valid currency",
    }),
    sessionDuration: z.string().min(1, "Please select session duration"),

    priceMin: z
      .number({
        required_error: "Enter minimum price",
        invalid_type_error: "Enter valid minimum price",
      })
      .min(1, "Minimum price must be greater than 0"),

    priceMax: z
      .number({
        required_error: "Enter maximum price",
        invalid_type_error: "Enter valid maximum price",
      })
      .min(1, "Maximum price must be greater than 0"),

    /* ---------------- AUTHORITY ---------------- */

    yearsOfExperience: z
      .number({
        required_error: "Select years of experience",
        invalid_type_error: "Select years of experience",
      })
      .min(0, "Experience cannot be negative"),

    certifications: z
      .array(
        z.object({
          value: z.string().trim().min(2, "Certification cannot be empty"),
        }),
      )
      .max(10, "Maximum 10 certifications allowed")
      .optional(),

    shortBio: z
      .string()
      .min(30, "Short bio must be at least 30 characters")
      .max(250, "Short bio cannot exceed 250 characters"),

    testimonials: z
      .preprocess(
        (val) => (Array.isArray(val) ? val : []),
        z.array(testimonialSchema).max(6),
      )
      .optional(),

    /* ---------------- TRUST LAST FORM ---------------- */
    //  profilePhoto: z
    // .any()
    // .refine((file) => file instanceof File, "Profile photo is required")
    // .refine(
    //   (file) => file instanceof File && file.size <= MAX_FILE_SIZE,
    //   "Max file size is 5MB"
    // )
    // .refine(
    //   (file) =>
    //     file instanceof File && ACCEPTED_IMAGE_TYPES.includes(file.type),
    //   "Only JPG, PNG or GIF allowed"
    // ),
    profilePhoto: z.union([
      z.string().url("Required"), // existing image URL allowed

      z
        .instanceof(File)
        .refine((file) => file.size <= MAX_FILE_SIZE, {
          message: "Max file size is 5MB",
        })
        .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
          message: "Only JPG, PNG or GIF allowed",
        }),
    ]),

    introVideo: z
      .string()
      .optional()
      .refine((val) => !val || /^https?:\/\/.+/.test(val), "Enter a valid URL"),

    linkedin: z
      .string()
      .min(1, "Primary social link is required")
      .refine((val) => /^https?:\/\/.+/.test(val), "Enter a valid URL"),
    /* ---------------- OPTIONAL FUTURE EXTENSIONS ---------------- */

    pricingPlans: z.any().optional(),
    availability: z.any().optional(),
  })

  /* ---------------- CROSS FIELD VALIDATION ---------------- */

  .refine((data) => data.priceMax >= data.priceMin, {
    message: "Maximum price must be greater than minimum price",
    path: ["priceMax"],
  });
// ***********************************************************
// ***********************************************************

// ─── Step 1: Program Basics ───────────────────────────────────────────────────
export const step1MMPSchema = z.object({
  title: z
    .string()
    .min(5, "Program title must be at least 5 characters")
    .max(100, "Program title cannot exceed 100 characters"),
  subtitle: z
    .string()
    .min(10, "Transformation promise must be at least 10 characters")
    .max(300, "Cannot exceed 300 characters"),
  duration: z.enum(["7 Days", "11 Days", "14 Days", "21 Days", "30 Days"], {
    errorMap: () => ({ message: "Please select a valid duration" }),
  }),
  unlockType: z.enum(["daily", "all"], {
    errorMap: () => ({ message: "Please select an unlock type" }),
  }),
  // Required — must upload before continuing
  thumbnailUrl: z.string().url("Please upload a thumbnail image to continue"),
});

// ─── Step 2: Achievements ─────────────────────────────────────────────────────
export const step2MMPSchema = z.object({
  achievements: z
    .array(
      z.object({
        value: z
          .string()
          .min(5, "Achievement must be at least 5 characters")
          .max(200, "Cannot exceed 200 characters"),
      }),
    )
    .min(1, "Add at least one achievement")
    .max(10, "Maximum 10 achievements allowed"),
});

// ─── Step 3: Module Builder ───────────────────────────────────────────────────
export const moduleSchema = z
  .object({
    id: z.number(),
    title: z
      .string()
      .min(3, "Module title must be at least 3 characters")
      .max(100, "Cannot exceed 100 characters"),
    type: z.enum(["video", "text"], {
      errorMap: () => ({ message: "Please select a content type" }),
    }),
    videoUrl: z.string().optional(),
    instructions: z
      .string()
      .min(10, "Instructions must be at least 10 characters")
      .max(2000, "Cannot exceed 2000 characters"),
    actionTask: z
      .string()
      .min(5, "Action task must be at least 5 characters")
      .max(500, "Cannot exceed 500 characters"),
  })
  .superRefine((mod, ctx) => {
    if (mod.type === "video") {
      if (!mod.videoUrl || mod.videoUrl.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Video URL is required for video modules",
          path: ["videoUrl"],
        });
      } else {
        const urlResult = z
          .string()
          .url("Please enter a valid URL (YouTube/Vimeo)")
          .safeParse(mod.videoUrl);
        if (!urlResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid URL (YouTube/Vimeo)",
            path: ["videoUrl"],
          });
        }
      }
    }
  });

export const step3MMPSchema = z.object({
  modules: z.array(moduleSchema).min(1, "Add at least one module"),
});

// ─── Step 4: Pricing ──────────────────────────────────────────────────────────
export const step4MMPSchema = z
  .object({
    isPaid: z.boolean(),
    currency: z.enum(["INR", "USD"]),
    price: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.isPaid) {
      const num = parseFloat(data.price);
      if (!data.price || isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid price",
          path: ["price"],
        });
      } else if (num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be greater than 0",
          path: ["price"],
        });
      } else if (data.currency === "INR" && num < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum price for INR is ₹10",
          path: ["price"],
        });
      } else if (data.currency === "USD" && num < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum price for USD is $1",
          path: ["price"],
        });
      }
    }
  });

// ─── Step 5: Completion & Certificate ────────────────────────────────────────
export const step5MMPSchema = z.object({
  threshold: z
    .number()
    .min(50, "Completion threshold must be at least 50%")
    .max(100, "Cannot exceed 100%"),
  certTitle: z
    .string()
    .min(5, "Certificate title must be at least 5 characters")
    .max(150, "Cannot exceed 150 characters"),
});

export const FeatureUserTypeEnum = z.enum([
  "COACH",
  "SOLOPRENEUR",
  "ENTHUSIAST",
]);
export const MembershipTypeEnum = z.enum(["FREE", "PAID"]);

// Validate the nested Plan Configs
export const PlanConfigSchema = z.object({
  id: z.string().optional(),
  membership: MembershipTypeEnum,
  userType: FeatureUserTypeEnum,
  isActive: z.boolean().default(true),
  config: z.record(z.string(), z.any()).default({}), // Ensures it is  a valid JSON object
});

// Validate the main Feature
export const FeatureSchema = z.object({
  key: z
    .string()
    .min(2, "Feature key must be at least 2 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Key can only contain letters, numbers, and underscores",
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().nullable().optional(),

  // JSON fields
  configSchema: z.record(z.string(), z.any()).nullable().optional(),
  actions: z
    .record(z.string(), z.array(FeatureUserTypeEnum))
    .nullable()
    .optional(),

  allowedUserTypes: z.array(FeatureUserTypeEnum).default([]),
  isActive: z.boolean().default(true),

  planConfigs: z.array(PlanConfigSchema).default([]),
});

// ─── Full Form Shape (used in main page + localStorage) ──────────────────────
export const fullFormSchema = z.object({
  step1: step1MMPSchema,
  step2: step2MMPSchema,
  step3: step3MMPSchema,
  step4: step4MMPSchema,
  step5: step5MMPSchema,
});

/* ======================
   INVOICE SERIES
====================== */

export const invoiceSeriesSchema = z.object({
  MAIN: z.object({
    format: z
      .string()
      .regex(
        /\{(YYYY|MM|DD|#+|STATE)\}/,
        "Must include a placeholder like {YYYY} or {###}",
      ),
    lastNumber: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(0, "Cannot be negative"),
  }),

  COACH: z.object({
    format: z
      .string()
      .regex(
        /\{(YYYY|MM|DD|#+|STATE)\}/,
        "Must include a placeholder like {YYYY} or {###}",
      ),
    lastNumber: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(0, "Cannot be negative"),
  }),
});

/* ======================
   MAIN FORM
====================== */

export const mtbBusinessProfileSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),

  address: z.string().min(5, "Address is required"),

  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number (e.g. 29ABCDE1234F1Z5)",
    ),

  lutNumber: z.string().regex(/^[A-Z0-9\-\/]+$/, "Invalid LUT number"),

  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),

  email: z.string().email("Invalid email"),

  invoiceSeries: invoiceSeriesSchema,
});

/* ======================
   TYPES
====================== */

export type MtbBusinessProfileFormValues = z.infer<
  typeof mtbBusinessProfileSchema
>;

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
export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
export type Step1Data = z.infer<typeof step1MMPSchema>;
export type Step2Data = z.infer<typeof step2MMPSchema>;
export type ModuleData = z.infer<typeof moduleSchema>;
export type Step3Data = z.infer<typeof step3MMPSchema>;
export type Step4Data = z.infer<typeof step4MMPSchema>;
export type Step5Data = z.infer<typeof step5MMPSchema>;
export type FullFormData = z.infer<typeof fullFormSchema>;
