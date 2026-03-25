// Store Types for Client-side usage

export interface BillingInfo {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  name: string;
  category: Category;
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
  creator: {
    id: string;
    name: string;
  };
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
  originalPrice?: number; // ✅ Original price before conversion
  originalCurrency?: string;
  item: Item;
}

export interface Order {
  id: string;
  totalAmount: number;
  currency?: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CartItem {
  id?: string;
  itemId?: string;
  item_id?: string;
  userId?: string;
  quantity?: number;
  item?: Item | { id: string };
  wasInWishlist?: boolean;
}

export interface WishlistItem {
  id: string;
  itemId: string;
  item: Item;
}

export interface DropdownOption {
  value: string;
  label: string;
}
