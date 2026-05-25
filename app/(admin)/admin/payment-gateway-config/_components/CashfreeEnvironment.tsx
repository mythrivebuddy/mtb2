"use client";

import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentConfigResponse } from "@/types/client/admin/payment-config.types";

type Props = {
  initialData: {
    mode: "prod" | "sandbox";
    baseUrl: string;
  };
};

export function CashfreeEnvironment({ initialData }: Props) {
  const queryClient = useQueryClient();

  const isProduction = initialData.mode === "prod";

  const toggleMutation = useMutation({
    mutationFn: async (isProduction: boolean) => {
      const res = await axios.patch("/api/admin/cashfree-config", {
        isProduction,
      });
      return res.data;
    },

   onSuccess: (data) => {
  const newMode = data.cashfreeMode as "prod" | "sandbox";

  queryClient.setQueryData<PaymentConfigResponse>(
    ["payment-config"],
    (old) => {
      if (!old) return old;

      return {
        ...old,
        cashfree: {
          ...old.cashfree,
          mode: newMode,
          baseUrl:
            newMode === "prod"
              ? "https://api.cashfree.com/pg"
              : "https://sandbox.cashfree.com/pg",
        },
      };
    }
  );

  // ✅ broadcast actual value (not generic flag)
  const channel = new BroadcastChannel("payment-config");
  channel.postMessage({ cashfreeMode: newMode });
  channel.close();

  toast.success("Cashfree environment updated");
},
  });

  function handleToggle() {
    toggleMutation.mutate(!isProduction);
  }

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle>Cashfree Environment</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Mode</span>
          <span
            className={`text-sm font-semibold ${
              isProduction ? "text-green-600" : "text-blue-600"
            }`}
          >
            {isProduction ? "Live" : "Test"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Base URL</span>
          <span className="text-xs break-all text-muted-foreground">
            {initialData.baseUrl}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">Toggle Environment</span>
          <Switch
            disabled={toggleMutation.isPending}
            checked={isProduction}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
