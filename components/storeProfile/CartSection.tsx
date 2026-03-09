import React from "react";
import { ShoppingCart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Item, CartItem } from "@/types/client/store";
import Image from "next/image";

// ─── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const RupeeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// ─── Props ─────────────────────────────────────────────────────────────────────
interface CartSectionProps {
  cart: CartItem[];
  getPriceForMembership: (item: Item) => number | null;
  getCurrencySymbol?: (currency?: string) => string;
  handleRemoveFromCart: (id: string) => void;
  calculateTotal: () => number;
  handleBuyAll: () => void;
  purchasingItemId: string | null;
}

// ─── Type guard ────────────────────────────────────────────────────────────────
const isFullItem = (item: Item | { id: string } | undefined): item is Item =>
  item != null && "basePrice" in item;

const CartSection: React.FC<CartSectionProps> = ({
  cart,
  getPriceForMembership,
  getCurrencySymbol: getCurrencySymbolProp,
  handleRemoveFromCart,
  calculateTotal,
  handleBuyAll,
  purchasingItemId,
}) => {
  const queryClient = useQueryClient();

  const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

  // Derive cart-level currency symbol from full items only
  const cartCurrencies = [
    ...new Set(
      cart
        .filter((c) => isFullItem(c.item))
        .map((c) => (c.item as Item).currency ?? "INR")
    ),
  ];

  // ✅ Calculate totals per currency
  const calculateTotalsByCurrency = () => {
    const totals: Record<string, number> = {};

    cart.forEach((cartItem) => {
      if (!isFullItem(cartItem.item)) return;
      const itemCurrency = cartItem.item.currency ?? "INR";
      const price = getPriceForMembership(cartItem.item);
      const effectivePrice = price ?? cartItem.item.basePrice;
      const lineTotal = effectivePrice * (cartItem.quantity ?? 1);

      totals[itemCurrency] = (totals[itemCurrency] || 0) + lineTotal;
    });

    return totals;
  };

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      const response = await axios.put(
        "/api/user/store/items/cart/update-item-quantity",
        { cartItemId, quantity }
      );
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

  const totalsByCurrency = calculateTotalsByCurrency();
  const hasMixedCurrencies = cartCurrencies.length > 1;

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
            {cart.map((cartItem) => {
              if (!isFullItem(cartItem.item)) return null;

              const itemCurrency = cartItem.item.currency ?? "INR";
              const isINR        = itemCurrency === "INR";
              const sym          = resolveCurrencySymbol(itemCurrency);
              const price        = getPriceForMembership(cartItem.item);
              const effectivePrice = price ?? cartItem.item.basePrice;
              const quantity     = cartItem.quantity ?? 1;

              return (
                <li
                  key={cartItem.id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Image with currency badge */}
                    <div className="relative">
                      <Image
                        src={cartItem.item.imageUrl || "/placeholder-image.jpg"}
                        alt={cartItem.item.name}
                        width={64}
                        height={64}
                        className="object-cover rounded-md"
                      />
                      <span
                        className={`absolute -top-2 -left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isINR
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isINR
                          ? <RupeeIcon className="w-2.5 h-2.5" />
                          : <DollarIcon className="w-2.5 h-2.5" />
                        }
                        {itemCurrency}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium">{cartItem.item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">
                          {sym}{Number(effectivePrice).toFixed(2)}
                        </span>
                        {price !== cartItem.item.basePrice && (
                          <span className="text-gray-500 line-through text-sm">
                            {sym}{Number(cartItem.item.basePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {cartItem.item.category?.name || "Unknown Category"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(cartItem.id!, quantity - 1)}
                        disabled={updateQuantityMutation.isPending}
                        className="bg-gray-200 px-2 py-1 rounded"
                      >
                        -
                      </button>
                      <span>{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(cartItem.id!, quantity + 1)}
                        disabled={updateQuantityMutation.isPending}
                        className="bg-gray-200 px-2 py-1 rounded"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="text-green-600 font-semibold">
                      {sym}{Number(effectivePrice * quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => handleRemoveFromCart(cartItem.id!)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ✅ Updated Cart total - Shows per-currency breakdown */}
          <div className="mt-4 text-right">
            {hasMixedCurrencies ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">Total Amount:</p>
                <div className="flex flex-col items-end gap-1">
                  {Object.entries(totalsByCurrency).map(([currency, total]) => {
                    const sym = resolveCurrencySymbol(currency);
                    const isINR = currency === "INR";

                    return (
                      <div
                        key={currency}
                        className="flex items-center gap-2 text-lg font-bold"
                      >
                        <span className={`inline-flex items-center gap-1 ${
                          isINR ? "text-orange-600" : "text-green-600"
                        }`}>
                          {isINR ? (
                            <RupeeIcon className="w-4 h-4" />
                          ) : (
                            <DollarIcon className="w-4 h-4" />
                          )}
                          <span>
                            {sym}{Number(total).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 font-normal">
                            {currency}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-orange-500 mt-1">
                  Select payment currency at checkout
                </p>
              </div>
            ) : (
              <div className="text-xl font-bold">
                Total Amount:{" "}
                <span className="text-green-600">
                  {resolveCurrencySymbol(cartCurrencies[0])}
                  {Number(calculateTotal()).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleBuyAll}
              disabled={purchasingItemId !== null}
              className="bg-green-600 text-white px-6 py-3 rounded-xl mt-4 disabled:bg-gray-400"
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