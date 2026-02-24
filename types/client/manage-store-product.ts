export interface Item {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  imageUrl: string;
  downloadUrl?: string;
  isApproved: boolean;
  createdByRole: string;
  createdByUserId: string;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  approver?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ItemFormData {
  name: string;
  category: string;
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  imageFile?: File;
  downloadFile?: File;
}

export interface Category {
  id: string;
  name: string;
}
