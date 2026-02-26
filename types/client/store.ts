
// export interface Item {
//   id: string;
//   name: string;
//   imageUrl: string;
//   basePrice: number;
//   monthlyPrice: number;
//   yearlyPrice: number;
//   lifetimePrice: number;
//   category: {
//     id: string;
//     name: string;
//   };
// }

// export interface Item {
//   id: string;
//   name: string;
//   categoryId: string;
//   imageUrl: string;
//   basePrice: number;
//   monthlyPrice: number;
//   yearlyPrice: number;
//   lifetimePrice: number;
//   category: {
//     id: string;
//     name: string;
//   };
// }
export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  name: string;
  category: Category;           // ✅ CHANGED from string to Category object
  categoryId: string;
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  currency: string;
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

export interface User {
  id: string;
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  item: Item;
}

export interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CartItem {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  item: Item;
  wasInWishlist?: boolean;
}

export interface WishlistItem {
  id: string;
  itemId: string;
  item: Item;
}

