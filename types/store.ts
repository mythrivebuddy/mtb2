export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  basePrice: number;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  lifetimePrice: number | null;
  category: {
    id: string;
    name: string;
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
  item: Item;
} 