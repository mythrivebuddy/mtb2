"use client";
import React, { useState } from "react";
import axios, { AxiosResponse } from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import OrderSection from "@/components/storeProfile/OrderSection";
import CartSection from "@/components/storeProfile/CartSection";
import WishlistSection from "@/components/storeProfile/WishlistSection";

import { Item, Order, CartItem, WishlistItem } from "@/types/client/store";
import { getAxiosErrorMessage } from "@/utils/ax";

interface User {
  id: string;
  name: string;
  email: string;
  membership: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";
}

function ProfilePage() {
  const [purchasingItemId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const fetchProfileData = async () => {
    const [profileRes, ordersRes, wishlistRes, cartRes] =
      await Promise.allSettled([
        axios.get("/api/user/store/profile"),
        axios.get("/api/user/store/items/orders"),
        axios.get("/api/user/store/items/wishlist"),
        axios.get("/api/user/store/items/cart/get-cart-items"),
      ]);
    const getData = <T,>(
      result: PromiseSettledResult<AxiosResponse<T>>,
      fallback: T
    ): T => {
      return result.status === "fulfilled" ? result.value.data : fallback;
    };

    return {
      user: getData(profileRes, { user: {} }),
      orders: getData(ordersRes, { orders: [] }),
      wishlist: getData(wishlistRes, { wishlist: [] }),
      cart: getData(cartRes, { cart: [] }),
    };
  };
  
  const { data, isLoading } = useQuery({
    queryKey: ["profileData"],
    queryFn: fetchProfileData,
  });

  const user = data?.user.user as User;
  const orders = (data?.orders.orders ?? []) as Order[];
  const wishlist = (data?.wishlist.wishlist ?? []) as WishlistItem[];
  const cart = (data?.cart.cart ?? []) as CartItem[];

  const getPriceForMembership = (item: Item): number => {
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
  };

  const calculateTotal = () =>
    cart.reduce(
      (total, c) =>
        total + getPriceForMembership(c.item) * c.quantity,
      0
    );

  // ✅ ADD TO CART (USED BY WISHLIST)
  const addToCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await axios.post("/api/user/store/items/cart/add-cart-items", { itemId });
      await axios.delete("/api/user/store/items/wishlist", {
        data: { itemId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Item added to cart");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err));
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) =>
      axios.delete("/api/user/store/items/cart/delete-cart-items", {
        data: { cartItemId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Item removed");
    },
  });

  const handleBuyAll = () => {
    if (!cart.length) {
      toast.warning("Cart is empty");
      return;
    }

    const query = cart
      .map((c) => `cartItem=${c.item.id}:${c.quantity}`)
      .join("&");

    router.push(`/dashboard/store/checkout?${query}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link
        href="/dashboard/store"
        className="inline-block mb-6 bg-jp-orange text-white px-4 py-2 rounded-full"
      >
        Back to Store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <WishlistSection
          wishlist={wishlist}
          getPriceForMembership={getPriceForMembership}
          handleAddToCart={addToCartMutation.mutate}
        />

        <CartSection
          cart={cart}
          getPriceForMembership={getPriceForMembership}
          handleRemoveFromCart={removeFromCartMutation.mutate}
          calculateTotal={calculateTotal}
          handleBuyAll={handleBuyAll}
          purchasingItemId={purchasingItemId}
        />

        <OrderSection
          orders={orders}
          getPriceForMembership={getPriceForMembership}
        />
      </div>
    </div>
  );
}

export default ProfilePage;
