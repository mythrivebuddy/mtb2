"use client";

import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["payment-config"] });

      toast.success(
        `Razorpay switched to ${
          updated.razorpayMode === "live" ? "Live" : "Test"
        } mode`,
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
