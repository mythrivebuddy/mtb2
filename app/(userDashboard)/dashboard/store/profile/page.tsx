"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {  toast } from "sonner";
import "react-toastify/dist/ReactToastify.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; 
import ProfileHeader from "@/components/storeProfile/ProfileHeader";
import OrderSection from "@/components/storeProfile/OrderSection";
import CartSection from "@/components/storeProfile/CartSection";
import WishlistSection from "@/components/storeProfile/WishlistSection";

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  mobile: string;
  country: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  membership: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";
  membershipEndDate?: string;
  addresses?: Address[];
}

interface Item {
  id: string;
  name: string;
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
}

interface CartItem {
  id: string;
  item: Item;
  quantity: number;
}

interface OrderItem extends Omit<Item, 'id'> {
  imageUrl: string;
}

interface Order {
  id: string;
  item: OrderItem | undefined;
  status: string;
  purchasedAt: string;
}

interface WishlistItem {
  id: string;
  item: Item;
}

function ProfilePage() {
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter(); 

  const fetchProfileData = async () => {
    const [profileRes, ordersRes, wishlistRes, cartRes] = await Promise.all([
      axios.get("/api/store/user/profile"),
      axios.get("/api/store/user/orders"),
      axios.get("/api/store/user/wishlist"),
      axios.get("/api/store/user/cart/getCartItems"),
    ]);
    return {
      user: profileRes.data.user as User,
      orders: ordersRes.data.orders as Order[],
      wishlist: wishlistRes.data.wishlist as WishlistItem[],
      cart: Array.isArray(cartRes.data.cart) ? (cartRes.data.cart as CartItem[]) : [],
    };
  };

  const { data, isLoading } = useQuery({ queryKey: ["profileData"], queryFn: fetchProfileData });
  const user = data?.user;
  const orders = data?.orders || [];
  const wishlist = data?.wishlist || [];
  const cart = data?.cart || [];

  const addToCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await axios.post("/api/store/user/cart/addCartItems", { itemId });
      await axios.delete("/api/store/user/wishlist", { data: { itemId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Item added to cart!");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || "Error adding item to cart.");
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      await axios.delete("/api/store/user/cart/deleteCartItems", { data: { cartItemId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Item removed from cart!");
    },
    onError: () => {
      toast.error("Error removing item from cart.");
    },
  });

  const handleBuyAll = async () => {
    if (cart.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }
    // Redirect to checkout page with cart items
    const cartItemsQuery = cart.map((cartItem) => `cartItem=${cartItem.item.id}:${cartItem.quantity}`).join("&");
    router.push(`/store/checkout?${cartItemsQuery}`);
  };

  const getPriceForMembership = (item: (Item | (Omit<Item, "id"> & { imageUrl: string })) | undefined): number => {
    if (!item) return 0;
    const price = (() => {
      switch (user?.membership) {
        case "MONTHLY":
          return item.monthlyPrice ?? item.basePrice;
        case "YEARLY":
          return item.yearlyPrice ?? item.basePrice;
        case "LIFETIME":
          return item.lifetimePrice ?? item.basePrice;
        default:
          return item.basePrice;
      }
    })();
    return price ?? 0;
  };

  const calculateTotal = () => {
    return cart.reduce((total, cartItem) => total + getPriceForMembership(cartItem.item) * cartItem.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-4">
        <Link href="/store" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold transition">
          Back to Store
        </Link>
      </div>
      <ProfileHeader user={user || null} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <OrderSection orders={orders} getPriceForMembership={getPriceForMembership} />
        <WishlistSection wishlist={wishlist} getPriceForMembership={getPriceForMembership} handleAddToCart={addToCartMutation.mutate} />
        <CartSection
          cart={cart}
          getPriceForMembership={getPriceForMembership}
          handleRemoveFromCart={removeFromCartMutation.mutate}
          calculateTotal={calculateTotal}
          handleBuyAll={handleBuyAll}
          purchasingItemId={purchasingItemId}
        />
      </div>
    </div>
  );
}

export default ProfilePage;