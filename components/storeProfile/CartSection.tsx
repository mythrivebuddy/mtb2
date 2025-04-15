import React from "react";
import { ShoppingCart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

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

interface CartSectionProps {
  cart: CartItem[];
  getPriceForMembership: (item: Item) => number;
  handleRemoveFromCart: (id: string) => void;
  calculateTotal: () => number;
  handleBuyAll: () => Promise<void>;
  purchasingItemId: string | null;
}

const CartSection: React.FC<CartSectionProps> = ({
  cart,
  getPriceForMembership,
  handleRemoveFromCart,
  calculateTotal,
  handleBuyAll,
  purchasingItemId,
}) => {
  const queryClient = useQueryClient();

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      const response = await axios.put(
        "/api/store/user/cart/update-quantity",
        { cartItemId, quantity },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Quantity updated successfully!");
    },
    onError: (error) => {
      console.error("Quantity update error:", error);
      toast.error("Failed to update quantity.");
    },
  });

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      if (window.confirm("Quantity will be 0. Remove item from cart?")) {
        handleRemoveFromCart(cartItemId);
      }
      return;
    }
    updateQuantityMutation.mutate({ cartItemId, quantity: newQuantity });
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 col-span-2">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <ShoppingCart className="w-5 h-5 mr-2 text-green-500" />
        My Cart
      </h3>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((cartItem) => (
              <li
                key={cartItem.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <span>{cartItem.item.name}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded cursor-pointer"
                      onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity - 1)}
                      disabled={updateQuantityMutation.isPending}
                    >
                      -
                    </button>
                    <span className="text-gray-800 font-semibold">{cartItem.quantity}</span>
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded cursor-pointer"
                      onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity + 1)}
                      disabled={updateQuantityMutation.isPending}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-green-600 font-semibold">
                    ${getPriceForMembership(cartItem.item) * cartItem.quantity}
                  </span>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md cursor-pointer"
                    onClick={() => handleRemoveFromCart(cartItem.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-xl font-bold text-right">
            Total Amount: ${calculateTotal()}
          </div>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold mt-4 w-full cursor-pointer"
            onClick={handleBuyAll} // Use handleBuyAll for redirection
            disabled={purchasingItemId !== null}
          >
            {purchasingItemId ? "Processing..." : "Buy All"}
          </button>
        </>
      )}
    </div>
  );
};

export default CartSection;