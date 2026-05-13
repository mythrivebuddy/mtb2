// /schema/user-financials-details.ts
import { z } from "zod";

export const userFinancialSchema = z
  .object({
    country: z.enum(["IN", "US", "UK", "EU", "OTHER"], {
      required_error: "Please select a country",
    }),
    whatsappNumber: z.string().min(10, "WhatsApp number is required"),
    
    // Tax Fields
    panNumber: z.string().optional(),
    isGstRegistered: z.boolean().default(false),
    gstNumber: z.string().optional(),
    taxId: z.string().optional(), // We will use this for US and OTHER
    vatNumber: z.string().optional(),
    taxFormType: z.enum(["W8BEN", "W9"]).optional(),
    
    // ... [Keep all your existing Banking Fields here] ...
    accountHolderName: z.string().optional(),
    accountNumber: z.string().optional(),
    confirmAccountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
    upiId: z.string().optional(),
    swiftCode: z.string().optional(),
    paypalId: z.string().optional(),
    bankAccountType: z.enum(["SAVINGS", "CURRENT"]).optional(),
  })
  .refine((data) => !data.accountNumber || data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers do not match",
    path: ["confirmAccountNumber"],
  })
  /* 
    VALIDATE: TAX DETAILS 
  */
  .superRefine((data, ctx) => {
    // --- INDIA ---
    if (data.country === "IN") {
      if (!data.panNumber || data.panNumber.trim().length < 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid PAN Number is required", path: ["panNumber"] });
      }
      if (data.isGstRegistered && (!data.gstNumber || data.gstNumber.trim().length < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GST Number is required when registered", path: ["gstNumber"] });
      }
    } 
    // --- US TAX RULES (UPDATED) ---
    else if (data.country === "US") {
      if (!data.taxFormType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a Tax Form", path: ["taxFormType"] });
      }
      if (!data.taxId || data.taxId.trim().length < 9) { // SSN/EINs are usually 9 digits
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSN, EIN, or ITIN is required", path: ["taxId"] });
      }
    } 
    // --- UK / EU ---
    else if (data.country === "UK" || data.country === "EU") {
      if (!data.vatNumber || data.vatNumber.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "VAT Number is required", path: ["vatNumber"] });
      }
    } 
    // --- OTHER ---
    else if (data.country === "OTHER") {
      if (!data.taxId || data.taxId.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tax ID is required", path: ["taxId"] });
      }
    }
  })
  /* 
    VALIDATE: BANKING [Keep your existing banking superRefine here] 
  */
  .superRefine((data, ctx) => {
    const hasBankDetails = !!data.accountHolderName?.trim() && !!data.accountNumber?.trim() && (data.country === "IN" ? !!data.ifscCode?.trim() : !!data.swiftCode?.trim());
    if (data.country === "IN") {
      if (!data.upiId?.trim() && !hasBankDetails) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide either UPI ID or full Bank Account details", path: ["upiId"] });
      }
    } else {
      if (!data.paypalId?.trim() && !hasBankDetails) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide either PayPal ID or full Bank Account details (with SWIFT)", path: ["paypalId"] });
      }
    }
  });
export type UserFinancialInput = z.infer<typeof userFinancialSchema>;