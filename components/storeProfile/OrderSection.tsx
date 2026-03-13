import React from "react";
import { Star, Download } from "lucide-react";
import { Order } from "@/types/client/store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GP: "GP",
  JP: "JP",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

type OrderWithCurrency = Order & { currency?: string };

interface OrdersSectionProps {
  orders: Order[];
  getCurrencySymbol?: (currency?: string) => string;
}

const formatPrice = (price: number, currency: string, sym: string) => {
  if (currency === "GP" || currency === "JP") {
    return `${Math.ceil(price)} ${currency}`;
  }
  return `${sym}${Number(price).toFixed(2)}`;
};

const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders,
  getCurrencySymbol: getCurrencySymbolProp,
}) => {
  const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

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
      case "completed":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleDownload = (downloadUrl: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // const calculateOrderTotal = (order: Order) => {
  //   return order.items.reduce((sum, item) => {
  //     return sum + item.priceAtPurchase * item.quantity;
  //   }, 0);
  // };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 col-span-2">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <Star className="w-5 h-5 mr-2 text-yellow-500" />
        My Orders
      </h3>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const orderCurrency = (order as OrderWithCurrency).currency ?? "INR";
            const orderSymbol = resolveCurrencySymbol(orderCurrency);
            const isPointsOrder = orderCurrency === "GP" || orderCurrency === "JP";
            // const exactTotal = calculateOrderTotal(order);
            const exactTotal = order.totalAmount;

            return (
              <li
                key={order.id}
                className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: <span className="font-mono">{order.id}</span>
                    </p>

                    <p className="text-sm text-gray-500">
                      Ordered:{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p
                      className={`text-xs font-semibold px-3 py-1 rounded-full w-fit bg-gray-100 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.toUpperCase()}
                    </p>

                    <p
                      className={`font-bold text-xl mt-2 ${isPointsOrder ? "text-purple-600" : "text-green-600"
                        }`}
                    >
                      {formatPrice(exactTotal, orderCurrency, orderSymbol)}
                    </p>

                    <p className="text-xs text-gray-500">Paid in {orderCurrency}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  {order.items.map((orderItem) => {
                    const downloadUrl = orderItem.item.downloadUrl;

                    return (
                      <div
                        key={orderItem.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-gray-50 border border-gray-100 p-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={orderItem.item.imageUrl}
                            alt={orderItem.item.name}
                            // width={100%}
                            // height={100%}

                            className="w-full h-full object-contain sm:w-24 sm:h-24 sm:object-fit rounded-lg"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-gray-900 font-semibold text-sm break-words">
                            {orderItem.item.name}
                          </h4>

                          <p className="text-sm text-gray-500">
                            {orderItem.item.category.name} • Qty: {orderItem.quantity}
                          </p>

                          <span className="font-semibold text-green-600">
                            {formatPrice(
                              orderItem.priceAtPurchase,
                              orderCurrency,
                              orderSymbol
                            )}
                          </span>
                        </div>

                        {downloadUrl ? (
                          <button
                            onClick={() =>
                              handleDownload(downloadUrl, orderItem.item.name)
                            }
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition shadow-sm w-full sm:w-auto justify-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No file
                          </span>
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