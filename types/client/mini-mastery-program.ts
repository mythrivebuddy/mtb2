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


export interface Creator {
  id: string;
  name: string;
  image: string | null;
}

export interface ModuleItem {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl?: string;
  instructions: string;
  actionTask: string;
}

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
  createdAt: string;
  thumbnailUrl: string | null;
  creator: Creator | null;
  createdBy: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProgramCompStatus {
  enrolled: boolean;
  completed: boolean;
}

export interface MyStatusResponse {
  statuses: Record<string, ProgramCompStatus>;
}

export type PricingFilter = "all" | "free" | "paid";
export type DurationFilter = "all" | "7" | "11" | "14" | "21" | "30";
export type SortOption = "newest" | "price_asc" | "price_desc";

export interface Filters {
  pricing: PricingFilter;
  duration: DurationFilter;
  sort: SortOption;
}

export interface Creator {
  id: string;
  name: string;
  image: string | null;
}

export interface ModuleItem {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl?: string;
  instructions: string;
  actionTask: string;
}

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
  thumbnailUrl: string | null;
  status: string | null;
  createdAt: string;
  creator: Creator | null;
}

export interface MyStatusResponse {
  statuses: Record<string, ProgramCompStatus>;
}