"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentConfigResponse } from "@/types/client/admin/payment-config.types";
import Link from "next/link";
import { useEffect } from "react";
import { BellIcon, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function AdminDashboardHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment-config"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/payment-config");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const channel = new BroadcastChannel("payment-config");

    channel.onmessage = (
      event: MessageEvent<{
        cashfreeMode?: "prod" | "sandbox";
        razorpayMode?: "live" | "test";
      }>,
    ) => {
      const { cashfreeMode, razorpayMode } = event.data;

      queryClient.setQueryData<PaymentConfigResponse>(
        ["payment-config"],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            cashfree: cashfreeMode
              ? {
                  ...old.cashfree,
                  mode: cashfreeMode,
                }
              : old.cashfree,

            razorpay: razorpayMode
              ? {
                  ...old.razorpay,
                  mode: razorpayMode,
                }
              : old.razorpay,
          };
        },
      );
    };

    return () => channel.close();
  }, [queryClient]);

  const isCashfreeLive = paymentConfig?.cashfree?.mode === "prod";
  const isRazorpayLive = paymentConfig?.razorpay?.mode === "live";
  const cashfreeMode = paymentConfig?.cashfree?.mode;
  const razorpayMode = paymentConfig?.razorpay?.mode;

  return (
    <header className="h-16 bg-white px-1 sm:px-8 lg:px-10 rounded-lg flex items-center justify-between">
      <div className="flex justify-between gap-4 sm:gap-8 w-full items-center">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => router.push("/admin/notifications")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <BellIcon size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {session?.data?.user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-sm sm:text-base">
              {session?.data?.user?.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {paymentConfig && (
            <>
              {/* Cashfree */}
              <Link
                href={`/admin/payment-gateway-config`}
                target="_blank"
                className={`text-xs font-medium px-1 sm:px-2 py-1 rounded border ${
                  isCashfreeLive
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                Cashfree Mode :{" "}
                {cashfreeMode === "prod"
                  ? "Live".toUpperCase()
                  : "Test".toUpperCase()}
              </Link>

              {/* Razorpay */}
              <Link
                href={`/admin/payment-gateway-config`}
                target="_blank"
                className={`text-xs font-medium px-1 sm:px-2 py-1 rounded border ${
                  isRazorpayLive
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                Razorpay Mode : {razorpayMode?.toUpperCase()}
              </Link>
            </>
          )}
        </div>
        <div className="block">
          <button onClick={async () => await signOut()}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
