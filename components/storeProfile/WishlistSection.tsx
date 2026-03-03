import React from "react";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Item, WishlistItem } from "@/types/client/store";

// ─── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// ─── Props ─────────────────────────────────────────────────────────────────────
interface WishlistSectionProps {
  wishlist: WishlistItem[];
  getPriceForMembership: (item: Item) => number;
  getCurrencySymbol?: (currency?: string) => string;
  handleAddToCart: (itemId: string) => void;
}

const WishlistSection: React.FC<WishlistSectionProps> = ({
  wishlist,
  getPriceForMembership,
  getCurrencySymbol: getCurrencySymbolProp,
  handleAddToCart,
}) => {
  const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 col-span-2">
      <h3 className="text-2xl font-semibold mb-6 flex items-center">
        <Heart className="w-6 h-6 mr-2 text-pink-500" />
        My Wishlist
      </h3>

      {!wishlist.length ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link
            href="/dashboard/store"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-3 rounded-full transition"
          >
            Browse Store
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {wishlist.map(({ item }) => {
            if (!item) return null;

            const itemCurrency =
              (item as Item & { currency?: string }).currency ?? "INR";
            const sym = resolveCurrencySymbol(itemCurrency);
            const price = getPriceForMembership(item);

            return (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex gap-4 items-center">
                  <Image
                    src={item.imageUrl || "/placeholder-image.jpg"}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />

                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-green-600 font-bold">
                      {sym}
                      {Number(price).toFixed(2)}
                    </p>
                    {item.category && (
                      <p className="text-sm text-gray-500">
                        {item.category.name}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(item.id)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-full transition self-start sm:self-center"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default WishlistSection;