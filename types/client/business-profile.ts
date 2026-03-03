export interface SocialHandles {
  linkedin?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
}

export interface BusinessProfile {
  id?: string;
  businessInfo?: string;
  missionStatement?: string;
  goals?: string;
  keyOfferings?: string;
  achievements?: string;
  email?: string;
  phone?: string;
  website?: string;
  socialHandles?: SocialHandles;
  featuredWorkTitle?: string;
  featuredWorkDesc?: string;
  featuredWorkImage?: string;
  priorityContactLink?: string;

  /* -------- BASIC INFO -------- */
  name: string;
  tagline: string;

  /* -------- NICHE -------- */
  coachingDomains: string[];
  targetAudience: string[];

  /* -------- TRANSFORMATION -------- */
  transformation: string;
  typicalResults: string[];

  /* -------- SESSION STYLE -------- */
  sessionStyles: string[];
  methodology: string;
  // ✅ FIXED: was `string`, but UserDetailsPage maps it as string[] and ProfileMain uses string[]
  toolsFrameworks?: string[];

  /* -------- SERVICES -------- */
  servicesOffered: string[];

  /* -------- SESSION & PRICING -------- */
  languages: string[];
  timezone: string;
  sessionFormat: string;
  sessionDuration: string;
  priceMin: number;
  priceMax: number;
  jpBalance: number;

  /* -------- AUTHORITY -------- */
  yearsOfExperience: number;
  certifications?: string[];
  shortBio: string;
  // ✅ FIXED: was `Testimonial[]`, but API may return JSON string; keep as Testimonial[] here
  // and handle parsing at the API boundary (mapToBusinessProfile)
  testimonials: Testimonial[];

  /* -------- TRUST -------- */
  // ✅ FIXED: File | string — File when uploading, string URL when displaying
  profilePhoto: File | string;
  introVideo?: string;
  linkedin?: string;

  /* -------- SYSTEM -------- */
  completionPercentage?: number;
}

export interface ProfileDisplayProps {
  profileData: BusinessProfile | null;
  onEditClick: () => void;
}