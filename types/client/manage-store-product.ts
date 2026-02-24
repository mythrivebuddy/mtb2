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
