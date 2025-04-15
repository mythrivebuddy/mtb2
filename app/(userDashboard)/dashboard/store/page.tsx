"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Loader2, ShoppingCart, Heart, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // Add useRouter for redirection

interface Category {
  category: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
}

interface WishlistItem {
  id: string;
  itemId: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const res = await axios.get("/api/store/items/getCategories");
  return res.data.categories;
};

const fetchUserMembership = async (): Promise<string> => {
  const res = await axios.get("/api/store/user/profile");
  return res.data.user?.membership || "FREE";
};

const fetchAllItems = async (): Promise<Item[]> => {
  const res = await axios.get("/api/store/items/get-all-items");
  return res.data.items || [];
};

const fetchItemsByCategory = async (category: string): Promise<Item[]> => {
  const res = await axios.get(`/api/store/items/getItemsByCategory?category=${category}`);
  return res.data.items || [];
};

const fetchWishlist = async (): Promise<WishlistItem[]> => {
  const res = await axios.get("/api/store/user/wishlist");
  return res.data.wishlist || [];
};

const StorePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter(); // Initialize router
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: membership = "FREE" } = useQuery({ queryKey: ["membership"], queryFn: fetchUserMembership });
  const { data: wishlist = [] } = useQuery({ queryKey: ["wishlist"], queryFn: fetchWishlist });
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", selectedCategory],
    queryFn: () => (selectedCategory ? fetchItemsByCategory(selectedCategory) : fetchAllItems()),
    placeholderData: (prev) => prev,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (wishlist.some((item) => item.itemId === itemId || item.id === itemId)) {
        await axios.delete("/api/store/user/wishlist", { data: { itemId } });
        toast.info("Removed from wishlist");
      } else {
        await axios.post("/api/store/user/wishlist", { itemId });
        toast.success("Added to wishlist");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const addToCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      try {
        const response = await axios.post("/api/store/user/cart/addCartItems", { itemId });
        if (response.data.success) {
          toast.success("Added to cart!");
        } else {
          toast.info(response.data.message || "Item already in cart!");
        }
      } catch (error) {
        toast.error("Something went wrong! Please try again.");
      }
    },
  });

  const getPriceForMembership = (item: Item): number => {
    switch (membership) {
      case "MONTHLY":
        return item.monthlyPrice;
      case "YEARLY":
        return item.yearlyPrice;
      case "LIFETIME":
        return item.lifetimePrice;
      default:
        return item.basePrice;
    }
  };

  const handleBuyNow = (itemId: string) => {
    router.push(`/store/checkout?itemId=${itemId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <Link href="/store/profile" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold">
          My Profile
        </Link>
      </div>
      <h1 className="text-4xl font-extrabold text-center mb-6 text-indigo-700">🛍 Welcome to the Store</h1>
      {/* <img
        src="https://djffehyaumoktssytmtq.supabase.co/storage/v1/object/sign/store/store.jpg.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzdG9yZS9zdG9yZS5qcGcucG5nIiwiaWF0IjoxNzQzMjIyODEzLCJleHAiOjE3NzQ3NTg4MTN9.fdzCxWRb63E5htWGZeygcyq0Ij-nuXIBq-Mhw3O0Uto"
        alt="Welcome to Our Store"
        className="w-100 rounded-lg shadow-lg ml-105"
      /> */}

      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-white ${selectedCategory === null ? "bg-indigo-700" : "bg-indigo-500"} hover:bg-indigo-600 transition-all cursor-pointer`}
        >
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`px-4 py-2 rounded-lg text-white ${selectedCategory === cat.category ? "bg-indigo-700" : "bg-indigo-500"} hover:bg-indigo-600 transition-all cursor-pointer`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">
        {selectedCategory ? `${selectedCategory} Items` : "All Products"}
      </h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
        </div>
      ) : (
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-600">No items available.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform relative">
                <button onClick={() => toggleWishlistMutation.mutate(item.id)} className="absolute bottom-40 right-4 cursor-pointer">
                  <Heart className={wishlist.some((w) => w.itemId === item.id) ? "text-red-500 w-6 h-6 fill-red-500" : "text-gray-500 w-6 h-6"} />
                </button>
                <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover rounded-xl mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{item.name}</h2>
                <p className="text-sm text-indigo-500 font-medium mb-2">{item.category}</p>

                <div className="flex flex-col items-start mb-4">
                  {membership !== "FREE" && (
                    <span className="text-lg text-gray-500 line-through">${item.basePrice}</span>
                  )}
                  <span className="text-xl font-bold text-green-600">${getPriceForMembership(item)}</span>
                </div>

                <div className="flex gap-4 mt-4">
                  <button className="bg-gray-500 text-white py-2 px-4 rounded-xl cursor-pointer" onClick={() => addToCartMutation.mutate(item.id)}>
                    <PlusCircle className="w-5 h-5 mr-2 inline" /> Add to Cart
                  </button>
                  <button
                    className="bg-indigo-600 text-white py-2 px-4 ml-11 rounded-xl cursor-pointer"
                    onClick={() => handleBuyNow(item.id)} 
                  >
                    <ShoppingCart className="w-5 h-5 mr-2 inline" /> Buy Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StorePage;