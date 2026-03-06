"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Order } from "@/types/client/store";

import PageLoader from "@/components/PageLoader";
import Image from "next/image";


const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$" };
const getCurrencySymbol = (currency?: string): string => CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

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
    refetchOnMount: true,
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

  if (isLoading) return <PageLoader />;

  const completedOrders = orders.filter((o) => o.status.toLowerCase() === "completed" || o.status.toLowerCase() === "delivered").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/store"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Store
          </Link>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <h1 className="text-2xl font-black mb-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Order History
                </h1>
                <p className="text-slate-600 text-lg">Track all your purchases and orders</p>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg min-w-[140px]">
                  <div className="text-3xl font-bold">{orders.length}</div>
                  <div className="text-indigo-100 text-sm mt-1">Total Orders</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg min-w-[140px]">
                  <div className="text-3xl font-bold">{completedOrders}</div>
                  <div className="text-emerald-100 text-sm mt-1">Completed</div>
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
              const sym = getCurrencySymbol();

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
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                        <div className={`p-3 rounded-2xl ${statusConfig.bg}`}>
                          <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-bold text-slate-800">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
                            >
                              {statusConfig.label}
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

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-0.5">Total Amount</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {sym}{order.totalAmount.toFixed(2)}
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
                          {order.items.map((orderItem) => (
                            <div
                              key={orderItem.id}
                              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
                                <Image
                                  src={orderItem.item.imageUrl || "/placeholder-image.jpg"}
                                  alt={orderItem.item.name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-slate-800 truncate">
                                  {orderItem.item.name}
                                </h5>
                                <p className="text-sm text-slate-500">
                                  {orderItem.item.category.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-500 mb-1">
                                  Qty: {orderItem.quantity}
                                </div>
                                <div className="font-bold text-slate-800">
                                  {sym}{orderItem.priceAtPurchase.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 font-medium">Order Total</span>
                            <span className="text-2xl font-bold text-slate-900">
                              {sym}{order.totalAmount.toFixed(2)}
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