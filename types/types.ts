import { Prisma } from "@prisma/client";

export interface Project {
  id: string;
  title: string;
  description: string;

  image: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
  postedDate: string;
}

// Simple category
export interface Category {
  id: string;
  name: string;
  isActive?: boolean;
}

// === PRISMA-BASED TYPES ===

export type CategoryWithQuestions = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string; // <-- Add this line
  questions: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    options: string[];
    categoryId: string;
    isMultiSelect: boolean;
  }[];
};


// Question with parent category
// export type QuestionWithCategory = Prisma.QuestionGetPayload<{
//   include: { category: true }
// }>;

// Full user (omit password)
type FullUser = Prisma.UserGetPayload<{
  include: {
    userBusinessProfile: true;
    spotlight: true;
    transaction: true;
  };
}>;

export type User = Omit<FullUser, "password">;

export interface LightCategory {
  id: string;
  name: string;
}

// types for admin cms 
/* ===========================
   Strong Schema Types
   =========================== */

export type FAQItem = {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
};

export type HowToStep = {
  "@type": "HowToStep";
  name: string;
  text: string;
};
export type HowToStepForm = {
  title: string;
  description: string;
};



export type ArticleFormData = {
  headline: string;
  author: string;
   description?: string;
  datePublished: string;
  image?: string;
};


export type FAQSchema = {
  "@context"?: string;     // add and allow string
  "@type": "FAQPage" | string;
  mainEntity: FAQItem[];
};


export type HowToSchema = {
  "@context"?: string;
  "@type": "HowTo" | string;
  step: HowToStep[];
};

export type ArticleSchema = {
  "@context"?: string;
  "@type": "Article" | string;
  headline: string;
   description?: string;
  datePublished: string;
  image?: string;
  author?: {
    "@type": "Person" | string;
    name: string;
  };
};

export type CustomJsonSchema = Record<string, unknown>;

export type SchemaMarkup =
  | ArticleSchema
  | FAQSchema
  | HowToSchema
  | CustomJsonSchema
  | null;

 export type FaqItem = {
  question: string;
  answer: string;
};