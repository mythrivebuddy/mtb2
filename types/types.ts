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

// This is your existing simple Category type, which can be used for basic UI elements.
export interface Category {
  id: string;
  name: string;
  isActive?: boolean;
}

// === ADDED NEW TYPES BASED ON PRISMA SCHEMA ===

// Use this type when you fetch a Category and want to include all its Questions.
export type CategoryWithQuestions = Prisma.CategoryGetPayload<{
  include: { questions: true }
}>;

// Use this type when you fetch a Question and want to include its parent Category.
export type QuestionWithCategory = Prisma.QuestionGetPayload<{
  include: { category: true }
}>;

// ===============================================

export type User = Prisma.UserGetPayload<{ 
  include: { 
    userBusinessProfile: true, 
    spotlight: true, 
    transaction: true 
  }, 
  omit: { password: true } 
}>;
