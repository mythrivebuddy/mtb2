"use client";

import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentConfigResponse } from "@/types/client/admin/payment-config.types";

type Props = {
  initialData: {
    mode: "test" | "live";
  };
};

export function RazorpayEnvironment({ initialData }: Props) {
  const queryClient = useQueryClient();

  const isLive = initialData.mode === "live";

  const toggleMutation = useMutation({
    mutationFn: async (isLive: boolean) => {
      const res = await axios.patch("/api/admin/razorpay-config", {
        isProduction: isLive,
      });
      return res.data;
    },

 onSuccess: (data) => {
  const newMode = data.razorpayMode as "live" | "test";

  // ✅ update cache instantly
  queryClient.setQueryData<PaymentConfigResponse>(
    ["payment-config"],
    (old) => {
      if (!old) return old;

      return {
        ...old,
        razorpay: {
          ...old.razorpay,
          mode: newMode,
        },
      };
    }
  );

  // ✅ broadcast to other tabs
  const channel = new BroadcastChannel("payment-config");
  channel.postMessage({ razorpayMode: newMode });
  channel.close();

  toast.success(
    `Razorpay switched to ${newMode === "live" ? "Live" : "Test"} mode`
  );
},
  });

  function handleToggle() {
    toggleMutation.mutate(!isLive);
  }

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle>Razorpay Environment</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Mode</span>
          <span
            className={`text-sm font-semibold ${
              isLive ? "text-green-600" : "text-blue-600"
            }`}
          >
            {isLive ? "Live" : "Test"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">Toggle Environment</span>
          <Switch disabled={toggleMutation.isPending} checked={isLive} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
}
