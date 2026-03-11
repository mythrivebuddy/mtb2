import React, { useEffect } from "react";
import { Star, Download, TrendingUp } from "lucide-react";
import { Order, Item } from "@/types/client/store";
import Image from "next/image";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GP: "GP",
  JP: "JP",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const RupeeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" /><path d="M6 8h12" /><path d="M6 13l8.5 8" /><path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const GPIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M15 9h-3.5a2.5 2.5 0 1 0 0 5h2a2.5 2.5 0 1 1 0 5H9" />
  </svg>
);

const JPIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
    <path d="M12 6v12" /><path d="M9 9h6" /><path d="M9 15h6" />
  </svg>
);

const CurrencyBadge = ({ currency }: { currency: string }) => {
  const badgeClass =
    currency === "GP"
      ? "bg-purple-100 text-purple-700"
      : currency === "JP"
      ? "bg-blue-100 text-blue-700"
      : currency === "INR"
      ? "bg-orange-100 text-orange-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`absolute -top-2 -left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${badgeClass}`}>
      {currency === "GP" ? (
        <GPIcon className="w-2.5 h-2.5" />
      ) : currency === "JP" ? (
        <JPIcon className="w-2.5 h-2.5" />
      ) : currency === "INR" ? (
        <RupeeIcon className="w-2.5 h-2.5" />
      ) : (
        <DollarIcon className="w-2.5 h-2.5" />
      )}
      {currency}
    </span>
  );
};

type OrderWithCurrency = Order & { currency?: string };
type ItemWithCurrency = Item & { currency?: string };

interface OrderItemWithDetails {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  originalPrice?: number;
  originalCurrency?: string;
  item: Item & { currency?: string };
}

interface OrdersSectionProps {
  orders: Order[];
  getCurrencySymbol?: (currency?: string) => string;
}

const formatPrice = (price: number, currency: string, sym: string) => {
  // For GP and JP, show whole numbers
  if (currency === "GP" || currency === "JP") {
    return `${Math.ceil(price)} ${currency}`;
  }
  // For regular currencies, show exact decimal amount
  return `${sym}${Number(price).toFixed(2)}`;
};

const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders,
  getCurrencySymbol: getCurrencySymbolProp,
}) => {
  useEffect(() => {
    console.log("=========== ORDERS DEBUG START ===========");
    orders?.forEach((order) => {
      console.log("Order ID:", order.id, "| Currency:", (order as OrderWithCurrency).currency, "| Total:", order.totalAmount);
      order.items?.forEach((item) => {
        const orderItem = item as unknown as OrderItemWithDetails;
        console.log("  Item:", item.item.name, "| Item Currency:", (item.item as ItemWithCurrency).currency, "| Price at Purchase:", item.priceAtPurchase, "| Original:", orderItem.originalPrice, orderItem.originalCurrency);
      });
    });
    console.log("=========== ORDERS DEBUG END ===========");
  }, [orders]);

  const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":  return "text-green-600";
      case "shipped":    return "text-blue-600";
      case "processing": return "text-yellow-600";
      case "pending":    return "text-orange-600";
      case "cancelled":  return "text-red-600";
      case "completed":  return "text-green-600";
      default:           return "text-gray-600";
    }
  };

  const handleDownload = (downloadUrl: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ✅ Calculate exact order total from priceAtPurchase (which is already converted)
  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((sum, item) => {
      return sum + (item.priceAtPurchase * item.quantity);
    }, 0);
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
            // ✅ Get the order's payment currency from the order object
            const orderCurrency = (order as OrderWithCurrency).currency ?? "INR";
            const orderSymbol = resolveCurrencySymbol(orderCurrency);
            const isPointsOrder = orderCurrency === "GP" || orderCurrency === "JP";
            
            // ✅ Calculate exact total from converted prices
            const exactTotal = calculateOrderTotal(order);

            // Check if any items were converted
            const itemsWithOriginal = order.items.filter((item) => {
              const orderItem = item as unknown as OrderItemWithDetails;
              return orderItem.originalCurrency && orderItem.originalCurrency !== orderCurrency;
            });
            const hasConvertedItems = itemsWithOriginal.length > 0;

            return (
              <li key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: <span className="font-mono">{order.id}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Ordered: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {isPointsOrder && (
                      <div className="flex gap-2 mt-1">
                        {orderCurrency === "GP" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
                            <GPIcon className="w-3 h-3" />
                            GP Order
                          </span>
                        )}
                        {orderCurrency === "JP" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                            <JPIcon className="w-3 h-3" />
                            JP Order
                          </span>
                        )}
                      </div>
                    )}
                    {hasConvertedItems && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                          <TrendingUp className="w-3 h-3" />
                          Converted to {orderCurrency}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </p>
                    <div className="mt-2">
                      {/* ✅ FIXED: Show exact converted total in payment currency */}
                      <p className={`font-bold text-lg ${isPointsOrder ? "text-purple-600" : "text-green-600"}`}>
                        {formatPrice(exactTotal, orderCurrency, orderSymbol)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Paid in {orderCurrency}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-3">
                  {order.items.map((orderItem) => {
                    const orderItemDetails = orderItem as unknown as OrderItemWithDetails;
                    const itemCurrency = (orderItem.item as ItemWithCurrency).currency ?? "INR";
                    const originalCurrency = orderItemDetails.originalCurrency ?? itemCurrency;
                    const originalPrice = orderItemDetails.originalPrice ?? orderItem.priceAtPurchase;
                    
                    const isGP = itemCurrency === "GP";
                    const isJP = itemCurrency === "JP";
                    const wasConverted = originalCurrency !== orderCurrency && !isGP && !isJP;
                    
                    const downloadUrl = orderItem.item.downloadUrl;

                    return (
                      <div key={orderItem.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                        <div className="relative flex-shrink-0">
                          <Image
                            src={orderItem.item.imageUrl}
                            alt={orderItem.item.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <CurrencyBadge currency={originalCurrency} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-gray-800 font-semibold">{orderItem.item.name}</h4>
                          <p className="text-sm text-gray-500">
                            {orderItem.item.category.name} • Qty: {orderItem.quantity}
                          </p>
                          <div className="space-y-1 mt-1">
                            {/* Show converted price */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold ${isGP || isJP ? "text-purple-600" : "text-green-600"}`}>
                                {formatPrice(orderItem.priceAtPurchase, orderCurrency, orderSymbol)}
                              </span>
                              <span className="text-xs text-gray-500">per item in {orderCurrency}</span>
                            </div>
                            
                            {/* Show original price if converted */}
                            {wasConverted && (
                              <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                                <div className="flex items-center gap-2 text-xs text-blue-800">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>
                                    Original: {getCurrencySymbol(originalCurrency)}{Number(originalPrice).toFixed(2)} {originalCurrency}
                                    <span className="mx-1">→</span>
                                    Converted: {orderSymbol}{Number(orderItem.priceAtPurchase).toFixed(2)} {orderCurrency}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {orderItem.quantity > 1 && (
                              <div className="text-sm text-gray-600 pt-1 border-t border-gray-200">
                                Subtotal: <span className="font-semibold">{formatPrice(orderItem.priceAtPurchase * orderItem.quantity, orderCurrency, orderSymbol)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {downloadUrl ? (
                          <button
                            onClick={() => handleDownload(downloadUrl, orderItem.item.name)}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-full transition flex-shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 flex-shrink-0 italic">No file</span>
                        )}
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