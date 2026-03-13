"use client";
import { useQuery } from "@tanstack/react-query";
import { CashfreeEnvironment } from "./_components/CashfreeEnvironment";
import { RazorpayEnvironment } from "./_components/RazorpayEnvironment";
import axios from "axios";


type PaymentConfigResponse = {
  success: boolean;
  cashfree: {
    mode: "prod" | "sandbox";
    baseUrl: string;
  };
  razorpay: {
    mode: "test" | "live";
  };
};
export default function PaymentGatewayEnvironmentPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-config"],
    queryFn: async () => {
      const res = await axios.get<PaymentConfigResponse>(
        "/api/admin/payment-config"
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <div className="text-sm">Loading payment environments...</div>;
  }

  if (isError || !data) {
    return (
      <div className="text-sm text-red-500">
        Failed to load payment configuration
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1  gap-6">
      <CashfreeEnvironment initialData={data.cashfree}/>
      <RazorpayEnvironment initialData={data.razorpay}/>
    </div>
  );
}