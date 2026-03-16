"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Order } from "@/types/client/store";

import PageLoader from "@/components/PageLoader";
import Image from "next/image";

// ─── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GP: "GP",
  JP: "JP"
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
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
    <path d="M12 6v6l4 2" />
  </svg>
);

const JPIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
    <path d="M12 6v12" /><path d="M9 9h6" /><path d="M9 15h6" />
  </svg>
);

const fetchOrderHistory = async (): Promise<Order[]> => {
  const res = await axios.get("/api/user/store/items/order-history");
  return res.data.orders || [];
};

const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();

  if (statusLower === "completed" || statusLower === "delivered") {
    return {
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Completed",
    };
  }

  if (statusLower === "processing" || statusLower === "pending") {
    return {
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "Processing",
    };
  }

  if (statusLower === "cancelled" || statusLower === "failed") {
    return {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Cancelled",
    };
  }

  return {
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: status,
  };
};

const OrderHistoryPage: React.FC = () => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orderHistory"],
    queryFn: fetchOrderHistory,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><PageLoader /></div>;

  const completedOrders = orders.filter((o) => o.status.toLowerCase() === "completed" || o.status.toLowerCase() === "delivered").length;

  // ✅ Helper to get currency icon component
  const getCurrencyIcon = (currency: string) => {
    if (currency === "INR") return RupeeIcon;
    if (currency === "USD") return DollarIcon;
    if (currency === "GP") return GPIcon;
    if (currency === "JP") return JPIcon;
    return RupeeIcon;
  };

  // ✅ Calculate exact order total from item prices
  const calculateExactTotal = (order: Order): number => {
    return order.items.reduce((sum, item) => {
      return sum + (item.priceAtPurchase * item.quantity);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-3 py-4 sm:px-4 md:p-6 lg:p-8 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/store"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Growth Store
          </Link>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <h1 className="text-2xl font-black mb-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Order History
                </h1>
                <p className="text-slate-600 text-lg">Track all your purchases and orders</p>
              </div>

              <div className="grid grid-cols-2  sm:flex gap-8 sm:gap-4 w-full sm:w-auto">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg min-w-0">
                  <div className="text-3xl font-bold">{orders.length}</div>
                  <div className="text-indigo-100 text-sm mt-1 whitespace-nowrap">Total Orders</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg min-w-0">
                  <div className="text-3xl font-bold">{completedOrders}</div>
                  <div className="text-emerald-100 text-sm mt-1 whitespace-nowrap">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-16 text-center border border-white/20">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                <Package className="w-16 h-16 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No Orders Yet</h3>
              <p className="text-slate-600 mb-8">Start shopping to see your order history here</p>
              <Link
                href="/dashboard/store"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600  hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Package className="w-5 h-5" />
                Browse Store
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const orderDate = new Date(order.createdAt);

              // ✅ Get order currency (defaults to INR if not set)
              const orderCurrency = order.currency || "INR";
              const orderSymbol = getCurrencySymbol(orderCurrency);
              const CurrencyIcon = getCurrencyIcon(orderCurrency);
              const isPoints = orderCurrency === "GP" || orderCurrency === "JP";

              // ✅ Calculate exact total from items
              const exactTotal = order.totalAmount || calculateExactTotal(order);

              return (
                <div
                  key={order.id}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20"
                >
                  {/* Order Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-2xl ${statusConfig.bg}`}>
                          <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-800">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
                            >
                              {statusConfig.label}
                            </span>
                            {/* ✅ Currency badge with icon */}
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${orderCurrency === "INR"
                              ? "bg-orange-100 text-orange-700 border border-orange-300"
                              : orderCurrency === "USD"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : orderCurrency === "GP"
                                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                                  : "bg-blue-100 text-blue-700 border border-blue-300"
                              }`}>
                              <CurrencyIcon className="w-3 h-3" />
                              {orderCurrency}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {orderDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package className="w-4 h-4" />
                              {order.items.length} {order.items.length === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-0.5">Total Amount</div>
                          {/* ✅ Show exact calculated total */}
                          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {isPoints
                              ? `${Math.ceil(exactTotal)} ${orderCurrency}`
                              : `${orderSymbol}${exactTotal.toFixed(2)}`
                            }
                          </div>
                        </div>
                        <div className="p-2">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50/50 to-white/50">
                      <div className="p-6">
                        <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
                          Order Items
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((orderItem) => {
                            // ✅ Check if item was converted
                            const wasConverted = orderItem.originalCurrency && orderItem.originalCurrency !== orderCurrency;
                            const originalSymbol = getCurrencySymbol(orderItem.originalCurrency);
                            const OriginalCurrencyIcon = getCurrencyIcon(orderItem.originalCurrency || "INR");
                            const itemTotal = orderItem.priceAtPurchase * orderItem.quantity;

                            return (
                              <div
                                key={orderItem.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                              >
                                <div className="w-16 h-16 sm:w-20 sm:h-20  rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 relative">
                                  <Image
                                    src={orderItem.item.imageUrl || "/placeholder-image.jpg"}
                                    alt={orderItem.item.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* ✅ Original currency badge if converted */}
                                  {wasConverted && (
                                    <span className={`absolute -top-1 -left-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${orderItem.originalCurrency === "INR"
                                      ? "bg-orange-500 text-white"
                                      : orderItem.originalCurrency === "USD"
                                        ? "bg-green-500 text-white"
                                        : "bg-purple-500 text-white"
                                      }`}>
                                      <OriginalCurrencyIcon className="w-2 h-2" />
                                      {orderItem.originalCurrency}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-slate-800 break-words">
                                    {orderItem.item.name}
                                  </h5>
                                  <p className="text-sm text-slate-500">
                                    {orderItem.item.category.name}
                                  </p>

                                  {/* ✅ Show conversion info if applicable */}
                                  {wasConverted && orderItem.originalPrice && (
                                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2 text-xs">
                                        <TrendingUp className="w-3 h-3 text-blue-600" />
                                        <div className="flex-1">
                                          <div className="text-blue-900 font-medium mb-0.5">Currency Conversion</div>
                                          <div className="flex items-center gap-2 text-blue-800">
                                            <span>Original: <span className="font-semibold">{originalSymbol}{orderItem.originalPrice.toFixed(2)} {orderItem.originalCurrency}</span></span>
                                            <span className="text-blue-400">→</span>
                                            <span>Paid: <span className="font-semibold">{orderSymbol}{orderItem.priceAtPurchase.toFixed(2)} {orderCurrency}</span></span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex sm:block justify-between sm:text-right w-full sm:w-auto">
                                  <div className="text-sm text-slate-500 mb-1">
                                    Qty: {orderItem.quantity}
                                  </div>
                                  <div className="font-bold text-lg text-slate-900">
                                    {isPoints
                                      ? `${Math.ceil(itemTotal)} ${orderCurrency}`
                                      : `${orderSymbol}${itemTotal.toFixed(2)}`
                                    }
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {isPoints
                                      ? `${Math.ceil(orderItem.priceAtPurchase)} ${orderCurrency} each`
                                      : `${orderSymbol}${orderItem.priceAtPurchase.toFixed(2)} each`
                                    }
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 pt-6 border-t border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-700 font-semibold flex items-center gap-2">
                              <CurrencyIcon className="w-4 h-4" />
                              Payment Currency
                            </span>
                            <span className="font-bold text-slate-900 text-lg">
                              {orderCurrency}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                            <span className="text-slate-700 font-bold text-lg">Order Total</span>
                            <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              {isPoints
                                ? `${Math.ceil(exactTotal)} ${orderCurrency}`
                                : `${orderSymbol}${exactTotal.toFixed(2)}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;