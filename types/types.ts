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
export type QuestionWithCategory = Prisma.QuestionGetPayload<{
  include: { category: true }
}>;

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
