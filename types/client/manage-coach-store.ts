// Types for managing store products (admin and user interfaces)

export interface Item {
  id: string;
  name: string;
  category: string; // This is the categoryId mapped as 'category'
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  imageUrl: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface ItemFormData {
  name: string;
  category: string; // categoryId
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

// Extended Item type with category object (for display purposes)
export interface ItemWithCategory extends Omit<Item, 'category'> {
  category: {
    id: string;
    name: string;
  };
}