export interface SocialHandles {
  linkedin?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
}

export interface Testimonial {
  name: string
  role: string
  content: string
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
  name: string
  tagline: string

  /* -------- NICHE -------- */
  coachingDomains: string[]
  targetAudience: string[]

  /* -------- TRANSFORMATION -------- */
  transformation: string
  typicalResults: string[]

  /* -------- SESSION STYLE -------- */
  sessionStyles: string[]
  methodology: string
  toolsFrameworks?: string

  /* -------- SERVICES -------- */
  servicesOffered: string[]

  /* -------- SESSION & PRICING -------- */
  languages: string[]
  timezone: string
  sessionFormat: string
  sessionDuration: string
  priceMin: number
  priceMax: number

  /* -------- AUTHORITY -------- */
  yearsOfExperience: number
  certifications?: string[]
  shortBio: string
  testimonials: Testimonial[]

  /* -------- TRUST -------- */
  profilePhoto: File | string   // File when uploading, string when saved URL
  introVideo?: string
  linkedin?: string

  /* -------- SYSTEM -------- */
  completionPercentage?: number
}

export interface ProfileDisplayProps {
  profileData: BusinessProfile | null;
  onEditClick: () => void;
}
