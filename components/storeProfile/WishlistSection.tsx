import React from "react";
import { Heart } from "lucide-react";

interface Item {
  id: string;
  name: string;
  basePrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
}

interface WishlistItem {
  item?: Item;
}

interface WishlistSectionProps {
  wishlist: WishlistItem[];
  getPriceForMembership: (item: Item) => number; // Updated prop name
  handleAddToCart: (itemId: string) => void;
}

const WishlistSection: React.FC<WishlistSectionProps> = ({
  wishlist,
  getPriceForMembership,
  handleAddToCart,
}) => {
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Heart className="w-5 h-5 mr-2 text-pink-500" />
        My Wishlist
      </h3>
      {wishlist.length === 0 ? (
        <p className="text-gray-500">Your wishlist is empty.</p>
      ) : (
        <ul className="space-y-4">
          {wishlist.map((wishlistItem) => {
            const item = wishlistItem.item || (wishlistItem as Item);
            return (
              <li
                key={item.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <span>{item.name}</span>
                <span className="text-green-600 font-semibold">
                  ${getPriceForMembership(item)}
                </span>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md ml-4 cursor-pointer"
                  onClick={() => handleAddToCart(item.id)}
                >
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