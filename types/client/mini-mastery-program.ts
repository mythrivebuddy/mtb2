import { ModuleData } from "@/schema/zodSchema";

export const MMP_STORAGE_KEY = "mmp_create_form";

export type ProgramStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED";

export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationDays: number | null;
  unlockType: string | null;
  price: number | null;
  currency: string | null;
  completionThreshold: number | null;
  certificateTitle: string | null;
  achievements: unknown;
  modules: unknown;
  status: string | null;
  isActive: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isComplete: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse {
  programs: Program[];
  pagination: Pagination;
}

// ─── DB Payload (what gets sent to API) ──────────────────────────────────────
export interface ProgramDBPayload {
  name: string;
  slug: string;
  description: string;
  durationDays: number;
  unlockType: string;
  achievements: string[];
  modules: ModuleData[];
  price: number;
  currency: string;
  completionThreshold: number;
  certificateTitle: string;
  thumbnailUrl: string;
  status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED";
}
