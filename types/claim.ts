export interface BuddyLensRequest {
  id: string;
  feedbackType: string;
  platform: string;
  domain: string;
  tier: string;
  jpCost: number;
  socialMediaUrl: string;
  status: 'OPEN' | 'PENDING' | 'CLAIMED' | 'SUBMITTED';
  requesterId: string;
  reviewerId?: string | null;
  pendingReviewerId?: string | null;
  questions: string[];
  isDeleted: boolean;
  createdAt: string; // ISO string from Prisma DateTime
  requester?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  reviewer?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string; // ISO string from Prisma DateTime
}
