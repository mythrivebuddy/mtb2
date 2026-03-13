import React from "react";
import { ShoppingCart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Item, CartItem } from "@/types/client/store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GP: "GP",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

const RupeeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const GPIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M15 9h-3.5a2.5 2.5 0 1 0 0 5h2a2.5 2.5 0 1 1 0 5H9" />
  </svg>
);

const CurrencyBadge = ({ currency }: { currency: string }) => {
  const badgeClass =
    currency === "GP"
      ? "bg-purple-100 text-purple-700"
      : currency === "INR"
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700";

  return (
    <span className={`absolute -top-2 -left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded ${badgeClass}`}>
      {currency === "GP" ? (
        <GPIcon className="w-2.5 h-2.5" />
      ) : currency === "INR" ? (
        <RupeeIcon className="w-2.5 h-2.5" />
      ) : (
        <DollarIcon className="w-2.5 h-2.5" />
      )}
      {currency}
    </span>
  );
};

interface CartSectionProps {
  cart: CartItem[];
  getPriceForMembership: (item: Item) => number | null;
  getCurrencySymbol?: (currency?: string) => string;
  handleRemoveFromCart: (id: string) => void;
  calculateTotal: () => number;
  handleBuyAll: () => void;
  purchasingItemId: string | null;
}

const isFullItem = (item: Item | { id: string } | undefined): item is Item =>
  item != null && "basePrice" in item;

const formatPrice = (price: number, currency: string, sym: string) =>
  currency === "GP"
    ? `${Math.ceil(price)} GP`
    : `${sym}${Number(price).toFixed(2)}`;

const CartSection: React.FC<CartSectionProps> = ({
  cart,
  getPriceForMembership,
  getCurrencySymbol: getCurrencySymbolProp,
  handleRemoveFromCart,
  handleBuyAll,
  purchasingItemId,
}) => {
  const queryClient = useQueryClient();
  const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      const response = await axios.put("/api/user/store/items/cart/update-item-quantity", { cartItemId, quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Quantity updated successfully!");
    },
    onError: () => toast.error("Failed to update quantity."),
  });

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      if (window.confirm("Remove item from cart?")) handleRemoveFromCart(cartItemId);
      return;
    }
    updateQuantityMutation.mutate({ cartItemId, quantity: newQuantity });
  };

  if (!cart || cart.some((c) => !isFullItem(c.item))) {
    return <p className="text-gray-500">Cart data is unavailable.</p>;
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 col-span-2">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <ShoppingCart className="w-5 h-5 mr-2 text-green-500" />
        My Cart
      </h3>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((cartItem) => {
              if (!isFullItem(cartItem.item)) return null;

              const itemCurrency = cartItem.item.currency ?? "INR";
              const sym = resolveCurrencySymbol(itemCurrency);
              const price = getPriceForMembership(cartItem.item);
              const effectivePrice = price ?? cartItem.item.basePrice;
              const quantity = cartItem.quantity ?? 1;

              return (
                <li
                  key={cartItem.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative">
                      <img
                        src={cartItem.item.imageUrl || "/placeholder-image.jpg"}
                        alt={cartItem.item.name}
                        // width={64}
                        // height={64}
                        className="w-full h-full object-contain sm:w-24 sm:h-24 sm:object-fit  rounded-md"
                      />
                      <CurrencyBadge currency={itemCurrency} />
                    </div>

                    <div>
                      <h4 className="text-md font-semibold text-gray-900">
                        {cartItem.item.name}
                      </h4>

                      <p className="text-sm text-gray-500">
                        {cartItem.item.category?.name || "Unknown Category"}
                      </p>

                      <span className="font-semibold text-green-600">
                        {formatPrice(effectivePrice, itemCurrency, sym)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(cartItem.id!, quantity - 1)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                      >
                        -
                      </button>

                      <span className="px-4">{quantity}</span>

                      <button
                        onClick={() => handleQuantityChange(cartItem.id!, quantity + 1)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-semibold text-green-600 min-w-[70px] sm:min-w-[90px] text-right">
                      {formatPrice(effectivePrice * quantity, itemCurrency, sym)}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveFromCart(cartItem.id!)}
                      className="px-3 py-2 sm:px-4 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs sm:text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Buy Button */}
          <div className="flex justify-start mt-6">
            <button
              onClick={handleBuyAll}
              disabled={purchasingItemId !== null}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:bg-gray-400"
            >
              {purchasingItemId ? "Processing..." : "Buy All"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartSection;