import React, { useEffect } from "react";
import { Star } from "lucide-react";
import { Order, Item } from "@/types/client/store";
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

// ─── Extended Types ────────────────────────────────────────────────────────────
type OrderWithCurrency = Order & { currency?: string };
type ItemWithCurrency = Item & { currency?: string };

// ─── Props ─────────────────────────────────────────────────────────────────────
interface OrdersSectionProps {
  orders: Order[];
  getCurrencySymbol?: (currency?: string) => string;
}

const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders,
  getCurrencySymbol: getCurrencySymbolProp,
}) => {
  // ✅ Console Orders Properly
  useEffect(() => {
    console.log("=========== ORDERS DEBUG START ===========");
    console.log("All Orders:", orders);

    orders?.forEach((order) => {
      console.log("Order ID:", order.id);
      console.log("Order Status:", order.status);
      console.log("Order Currency:", (order as OrderWithCurrency).currency);
      console.log("Total Amount:", order.totalAmount);

      order.items?.forEach((item) => {
        console.log("  Item Name:", item.item.name);
        console.log("  Item Currency:", (item.item as ItemWithCurrency).currency);
        console.log("  Price At Purchase:", item.priceAtPurchase);
      });
    });

    console.log("=========== ORDERS DEBUG END ===========");
  }, [orders]);

  const resolveCurrencySymbol =
    getCurrencySymbolProp ?? getCurrencySymbol;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-600";
      case "shipped":
        return "text-blue-600";
      case "processing":
        return "text-yellow-600";
      case "pending":
        return "text-orange-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 col-span-2">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Star className="w-5 h-5 mr-2 text-yellow-500" />
        My Orders
      </h3>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const orderCurrency =
              (order as OrderWithCurrency).currency ??
              (order.items?.[0]?.item as ItemWithCurrency)?.currency ??
              "INR";

            const orderSym = resolveCurrencySymbol(orderCurrency);

            const itemCurrencies = order.items.map(
              (item) =>
                (item.item as ItemWithCurrency).currency ?? "INR"
            );
            const uniqueCurrencies = [...new Set(itemCurrencies)];
            const hasMixedCurrencies = uniqueCurrencies.length > 1;

            return (
              <li key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: <span className="font-mono">{order.id}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Ordered:{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.toUpperCase()}
                    </p>

                    <div className="mt-2">
                      <p className="text-green-600 font-bold text-lg">
                        {orderSym}
                        {Number(order.totalAmount).toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1 font-normal">
                          {orderCurrency}
                        </span>
                      </p>
                      {hasMixedCurrencies && (
                        <p className="text-xs text-orange-500 mt-1">
                          Mixed currencies
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 border-t pt-3">
                  {order.items.map((orderItem) => {
                    const itemCurrency =
                      (orderItem.item as ItemWithCurrency).currency ?? "INR";

                    const isINR = itemCurrency === "INR";
                    const sym = resolveCurrencySymbol(itemCurrency);

                    return (
                      <div
                        key={orderItem.id}
                        className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="relative flex-shrink-0">
                          <Image
                            src={orderItem.item.imageUrl}
                            alt={orderItem.item.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <span
                            className={`absolute -top-2 -left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                              isINR
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isINR ? (
                              <RupeeIcon className="w-2.5 h-2.5" />
                            ) : (
                              <DollarIcon className="w-2.5 h-2.5" />
                            )}
                            {itemCurrency}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-gray-800 font-semibold">
                            {orderItem.item.name}
                          </h4>

                          <p className="text-sm text-gray-500">
                            {orderItem.item.category.name} • Qty:{" "}
                            {orderItem.quantity}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-green-600 font-semibold">
                              {sym}
                              {Number(orderItem.priceAtPurchase).toFixed(2)}
                            </span>

                            {orderItem.priceAtPurchase !==
                              orderItem.item.basePrice && (
                              <span className="text-gray-400 line-through text-sm">
                                {sym}
                                {Number(orderItem.item.basePrice).toFixed(2)}
                              </span>
                            )}

                            {orderItem.quantity > 1 && (
                              <span className="text-sm text-gray-500">
                                (×{orderItem.quantity} = {sym}
                                {Number(
                                  orderItem.priceAtPurchase *
                                    orderItem.quantity
                                ).toFixed(2)}
                                )
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OrdersSection;