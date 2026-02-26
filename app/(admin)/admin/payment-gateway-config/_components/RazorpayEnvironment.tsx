"use client";

import React from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


type RazorpayConfig = {
  mode: "test" | "live";
};

export function RazorpayEnvironment() {
  const queryClient = useQueryClient();

  /* -------------------------------
     GET current Razorpay config
  -------------------------------- */
  const { data, isLoading } = useQuery({
    queryKey: ["razorpay-config"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/razorpay-config");
      return res.data;
    },
  });

  /* -------------------------------
     PATCH toggle mode (test ↔ live)
  -------------------------------- */
  const toggleMutation = useMutation({
    mutationFn: async (isLive: boolean) => {
      const res = await axios.patch("/api/admin/razorpay-config", {
        isProduction: isLive,
      });
      return res.data;
    },

    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["razorpay-config"],
        (prev: RazorpayConfig) => ({
          ...prev,
          mode: updated.razorpayMode,
        })
      );
         toast.success(
      `Razorpay switched to ${
        updated.razorpayMode === "live" ? "Live" : "Test"
      } mode`
    );
    },
  });

  if (isLoading) {
    return <div className="text-sm">Loading Razorpay Environment...</div>;
  }



  const mode: "test" | "live" = data?.mode ?? data?.razorpayMode ?? "test";
  const isLive = mode === "live";

  function handleToggle() {
    toggleMutation.mutate(!isLive);
  }

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle>Razorpay Environment</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Mode */}
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

        {/* Toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">Toggle Environment</span>
          <Switch checked={isLive} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
}