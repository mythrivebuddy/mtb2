

"use client";
import React, { useState } from "react";
import axios, { AxiosResponse } from "axios";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import OrderSection from "@/components/storeProfile/OrderSection";
import CartSection from "@/components/storeProfile/CartSection";
import WishlistSection from "@/components/storeProfile/WishlistSection";

import { Item, Order, CartItem, WishlistItem } from "@/types/client/store";
import { getAxiosErrorMessage } from "@/utils/ax";
import AppLayout from "@/components/layout/AppLayout";
import { useSession } from "next-auth/react";
import PageLoader from "@/components/PageLoader";


function StoreProfilePageComponent() {
    const [purchasingItemId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const router = useRouter();
    const { status: authStatus } = useSession();

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
         enabled: authStatus === "authenticated",
        // refetchOnMount: true,
        // refetchOnWindowFocus: true,
        // refetchInterval: 5000,
        // refetchIntervalInBackground: false,
    });

    const orders = (data?.orders.orders ?? []) as Order[];
    const wishlist = (data?.wishlist.wishlist ?? []) as WishlistItem[];
    const cart = (data?.cart.cart ?? []) as CartItem[];

    // Always use base price
    const getPrice = (item: Item): number => {
        return item.basePrice;
    };

    const calculateTotal = () =>
        cart.reduce(
            (total, c) => {
                // Handle optional item property
                if (!c.item || typeof c.item === 'object' && 'id' in c.item && !('basePrice' in c.item)) {
                    return total;
                }
                const item = c.item as Item;
                return total + getPrice(item) * (c.quantity ?? 1);
            },
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
            .filter((c) => c.item && typeof c.item === 'object' && 'id' in c.item)
            .map((c) => {
                const item = c.item as Item;
                return `cartItem=${item.id}:${c.quantity ?? 1}`;
            })
            .join("&");

        if (!query) {
            toast.warning("Cart has no valid items");
            return;
        }

        router.push(`/dashboard/store/checkout?${query}`);
    };

    if (isLoading || authStatus === "loading") {
        return (
            <div className="flex h-screen items-center justify-center">
                <PageLoader/>
            </div>
        );
    }
    const pageContent = (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="container mx-auto px-3 py-4 sm:px-4 md:p-6 lg:p-8">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                🛒 My Cart & Orders
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your wishlist, cart, and orders</p>
                        </div>
                        <Link
                            href="/dashboard/store"
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-lg px-2 py-2.5 sm:px-6 sm:py-3  transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Growth Store
                        </Link>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <WishlistSection
                        wishlist={wishlist}
                        getPriceForMembership={getPrice}
                        handleAddToCart={addToCartMutation.mutate}
                    />

                    <CartSection
                        cart={cart}
                        getPriceForMembership={getPrice}
                        handleRemoveFromCart={removeFromCartMutation.mutate}
                        calculateTotal={calculateTotal}
                        handleBuyAll={handleBuyAll}
                        purchasingItemId={purchasingItemId}
                    />

                    <div className="md:col-span-2 mt-2 sm:mt-0">
                        <OrderSection orders={orders} />
                    </div>
                </div>
            </div>
        </div>
    )
    console.log("CART DATA:", cart);
    return authStatus === "authenticated" ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {pageContent}
        </div>
    ) : (
        <AppLayout>{pageContent}</AppLayout>
    );
}

export default StoreProfilePageComponent;