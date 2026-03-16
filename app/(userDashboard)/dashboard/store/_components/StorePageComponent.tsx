"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { ShoppingCart, Heart, PlusCircle, ChevronDown, Check, History } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Item, WishlistItem, Category } from "@/types/client/store";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/layout/AppLayout";

// ✅ Updated to include GP
const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: "₹",
    USD: "$",
    GP: "GP"
};

const getCurrencySymbol = (currency?: string): string =>
    CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

type ProductFilter = "ALL" | "ADMIN" | "COACH";

interface CartItem {
    id?: string;
    itemId?: string;
    item_id?: string;
    item?: { id: string };
}

interface DropdownOption {
    value: string;
    label: string;
}

const isItemInCart = (cartItems: CartItem[], itemId: string): boolean => {
    return cartItems.some((c) => {
        if (c.itemId && String(c.itemId) === String(itemId)) return true;
        if (c.item_id && String(c.item_id) === String(itemId)) return true;
        if (c.id && String(c.id) === String(itemId)) return true;
        if (c.item?.id && String(c.item.id) === String(itemId)) return true;
        return false;
    });
};

const CustomDropdown = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    accentColor = "blue",
}: {
    options: DropdownOption[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    accentColor?: "blue" | "violet";
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

    const isBlue = accentColor === "blue";
    const ringClass = isBlue ? "ring-blue-100 border-blue-300" : "ring-violet-100 border-violet-300";
    const gradientClass = isBlue ? "from-blue-400 to-indigo-500" : "from-violet-400 to-purple-500";
    const checkColor = isBlue ? "text-blue-600" : "text-violet-600";
    const hoverBg = isBlue ? "hover:bg-blue-50" : "hover:bg-violet-50";
    const selectedBg = isBlue ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700";

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative min-w-[200px]">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${open
                    ? `shadow-lg ring-2 ${ringClass}`
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
            >
                <span className={value ? "text-gray-800" : "text-gray-700"}>{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-gray-600" : "text-gray-400"}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
                    <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${isSelected ? `${selectedBg} font-semibold` : `text-gray-700 ${hoverBg}`
                                        }`}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className={`w-4 h-4 shrink-0 ${checkColor}`} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const fetchCategories = async (): Promise<Category[]> => {
    const res = await axios.get("/api/user/store/items/get-categories");
    return res.data.categories;
};

const fetchAllItems = async (): Promise<Item[]> => {
    const res = await axios.get("/api/user/store/items/get-all-items");
    return res.data.items || [];
};

const fetchItemsByCategory = async (categoryId: string): Promise<Item[]> => {
    const res = await axios.get(`/api/user/store/items/get-items-by-category?category=${categoryId}`);
    return res.data.items || [];
};

const fetchWishlist = async (): Promise<WishlistItem[]> => {
    const res = await axios.get("/api/user/store/items/wishlist");
    return res.data.wishlist || [];
};

const fetchCartItems = async (): Promise<CartItem[]> => {
    const res = await axios.get("/api/user/store/items/cart/get-cart-items");
    return res.data.cart || res.data.cartItems || [];
};

const StorePageComponent: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [productFilter, setProductFilter] = useState<ProductFilter>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [addingItemId, setAddingItemId] = useState<string | null>(null);
    const { data: session, status: authStatus } = useSession();

    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
        // refetchOnMount: true,
        // refetchOnWindowFocus: true,
    });

    const { data: wishlist = [], isLoading: wishlistLoading } = useQuery({
        queryKey: ["wishlist"],
        queryFn: fetchWishlist,
        enabled: authStatus === "authenticated",
    });

    const { data: cartItems = [], isLoading: cartLoading } = useQuery({
        queryKey: ["cart"],
        queryFn: fetchCartItems,
        enabled: authStatus === "authenticated",
    });

    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: ["items", selectedCategory],
        queryFn: () => selectedCategory ? fetchItemsByCategory(selectedCategory) : fetchAllItems(),
        placeholderData: (prev) => prev,
    });

    const toggleWishlistMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const exists = wishlist.some((item) => item.itemId === itemId);

            if (exists) {
                await axios.delete("/api/user/store/items/wishlist", { data: { itemId } });
            } else {
                await axios.post("/api/user/store/items/wishlist", { itemId });
            }

            return { itemId, exists };
        },

        // ⭐ Optimistic Update - FIXED TYPE ERRORS
        onMutate: async (itemId: string) => {
            await queryClient.cancelQueries({ queryKey: ["wishlist"] });

            const previousWishlist = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);

            queryClient.setQueryData<WishlistItem[]>(["wishlist"], (old = []) => {
                const exists = old.some((item) => item.itemId === itemId);

                if (exists) {
                    return old.filter((item) => item.itemId !== itemId);
                }

                // Create a proper WishlistItem object
                return [...old, { itemId, id: itemId, item: { id: itemId } } as WishlistItem];
            });

            return { previousWishlist };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousWishlist) {
                queryClient.setQueryData(["wishlist"], context.previousWishlist);
            }
            toast.error("Something went wrong");
        },

        onSuccess: (data) => {
            if (data.exists) {
                toast.info("Removed from wishlist");
            } else {
                toast.success("Added to wishlist");
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    });

    const addToCartMutation = useMutation({
        mutationFn: async (itemId: string) => {
            setAddingItemId(itemId);
            const response = await axios.post("/api/user/store/items/cart/add-cart-items", { itemId });
            return response.data;
        },

        onSuccess: async () => {
            toast.success("Item added to cart");
            setAddingItemId(null);

            await queryClient.invalidateQueries({
                queryKey: ["cart"],
                refetchType: "active",
            });
        },
        onError: (error) => {
            setAddingItemId(null);
            toast.error(getAxiosErrorMessage(error, "Something went wrong! Please try again."));
        },
    });

    const redirectToLogin = (callbackUrl: string) => {
        router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    };
    // Always use base price
    const getPrice = (item: Item): number => {
        return item.basePrice;
    };

    const handleBuyNow = (itemId: string) => router.push(`/dashboard/store/checkout?cartItem=${itemId}:1`);

    if (categoriesLoading || itemsLoading || (authStatus === "authenticated" && (wishlistLoading || cartLoading))) return <div className="min-h-screen flex justify-center items-center"> <PageLoader /> </div>;

    const categoryOptions: DropdownOption[] = [
        { value: "", label: "All Categories" },
        ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
    ];

    const productFilterOptions: DropdownOption[] = [
        { value: "ALL", label: "All Products" },
        { value: "ADMIN", label: "Products by MTB" },
        { value: "COACH", label: "Products by Coaches" },
    ];

    const filteredItems = items.filter((item) => {
        if (!item.isApproved) return false;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            if (!item.name.toLowerCase().includes(query) && !item.category.name.toLowerCase().includes(query)) return false;
        }
        if (productFilter === "ALL") return true;
        if (productFilter === "ADMIN") return item.createdByRole === "ADMIN";
        // COACH filter: Show all USER-created products (including the current user's products)
        if (productFilter === "COACH") return item.createdByRole === "USER";
        return true;
    });

    const pageContent = (
        <>

            <div className="container mx-auto p-4 md:p-6 lg:p-8">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🛍 Growth Store</h1>
                            <p className="text-gray-600 mt-1">Explore curated products that support your growth, clarity, and transformation.</p>
                        </div>
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <button
                                onClick={() => {
                                    if (!session) {
                                        redirectToLogin("/dashboard/store/order-history");
                                        return;
                                    }

                                    router.push("/dashboard/store/order-history");
                                }}
                                className="bg-green-600 text-white hover:bg-green-700 font-semibold text-sm rounded-lg px-4 sm:px-6 py-3  transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <History className="w-4 h-4" />
                                Order History
                            </button>
                            <Link
                                href="/dashboard/store/profile"
                                className="bg-gradient-to-r from-blue-500 to-indigo-600  hover:from-blue-600 hover:to-indigo-700  text-white font-semibold text-sm rounded-lg px-4 sm:px-6 py-3  transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                My Cart & Orders
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <div className="flex gap-4 flex-wrap items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products or categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-5 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm"
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <CustomDropdown options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} placeholder="All Categories" accentColor="blue" />
                        <CustomDropdown options={productFilterOptions} value={productFilter} onChange={(val) => setProductFilter(val as ProductFilter)} placeholder="All Products" accentColor="violet" />
                    </div>
                </div>

                {/* Results Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {selectedCategory
                            ? `${categories.find((c) => c.id === selectedCategory)?.name || "Selected"} Items`
                            : productFilter === "ADMIN" ? "Products by Mtb" : productFilter === "COACH" ? "Products by Coaches" : "All Products"}
                    </h2>
                    <span className="text-gray-600 font-medium">{filteredItems.length} {filteredItems.length === 1 ? "product" : "products"} found</span>
                </div>

                {/* Grid */}
                {filteredItems.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                            <p className="text-gray-500">{searchQuery ? "Try adjusting your search or filters" : "No items available at the moment"}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredItems.map((item) => {
                            // ✅ Updated to handle GP currency
                            const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
                            const sym = getCurrencySymbol(itemCurrency);
                            const isGP = itemCurrency === "GP";
                            const price = getPrice(item);
                            const inCart = isItemInCart(cartItems, item.id);

                            return (
                                <div key={item.id} className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col">
                                    <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                        <Image src={item.imageUrl || "/placeholder-image.jpg"} alt={item.name} width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        <button
                                            onClick={() => toggleWishlistMutation.mutate(item.id)}
                                            className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-300"
                                        >
                                            <Heart
                                                className={
                                                    wishlist.some((w) => w.itemId === item.id)
                                                        ? "text-red-500 w-5 h-5 fill-red-500 transition"
                                                        : "text-gray-600 w-5 h-5 transition"
                                                }
                                            />
                                        </button>
                                        <div className="absolute top-3 left-3">
                                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold rounded-full shadow-md">{item.category.name}</span>
                                        </div>

                                        {/* ✅ Currency Badge */}
                                        {itemCurrency !== "INR" && (
                                            <div className="absolute bottom-3 left-3">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-md ${itemCurrency === "USD"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-purple-100 text-purple-700"
                                                    }`}>
                                                    {itemCurrency}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">{item.name}</h3>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            {/* ✅ FIXED: Added space after GP symbol */}
                                            <span className="text-2xl font-bold text-green-600">
                                                {isGP ? `${sym} ${Number(price).toFixed(0)}` : `${sym}${Number(price).toFixed(2)}`}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                                            {inCart ? (
                                                <Link href="/dashboard/store/profile" className="flex-1 flex items-center justify-center  bg-green-600  hover:bg-green-700 gap-1.5  active:scale-95 text-white font-semibold text-xs rounded-xl px-3 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md">
                                                    <ShoppingCart className="w-4 h-4 shrink-0" />
                                                    <span>Cart</span>
                                                </Link>
                                            ) : (
                                                <button
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50 active:scale-95 text-blue-600 font-semibold text-xs rounded-xl px-3 py-2 border-2 border-blue-500 hover:border-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                    onClick={() => {
                                                        if (!session) {
                                                            redirectToLogin("/dashboard/store");
                                                            return;
                                                        }

                                                        addToCartMutation.mutate(item.id);
                                                    }}
                                                    disabled={addingItemId === item.id}
                                                >
                                                    <PlusCircle className="w-4 h-4 shrink-0" />
                                                    <span>{addingItemId === item.id ? "Adding..." : "Add to Cart"}</span>
                                                </button>
                                            )}
                                            <button
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700  active:scale-95  font-semibold text-xs rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-all duration-200"
                                                onClick={() => {
                                                    if (!session) {
                                                        redirectToLogin(`/dashboard/store/checkout?cartItem=${item.id}:1`);
                                                        return;
                                                    }

                                                    handleBuyNow(item.id);
                                                }}
                                            >
                                                <ShoppingCart className="w-4 h-4 shrink-0" />
                                                <span>Buy Now</span>
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </>
    )

    return authStatus === "authenticated" ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {pageContent}
        </div>
    ) : (
        <AppLayout>{pageContent}</AppLayout>
    );
};

export default StorePageComponent;