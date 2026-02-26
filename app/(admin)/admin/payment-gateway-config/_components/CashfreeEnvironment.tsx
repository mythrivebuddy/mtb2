"use client";

import React from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type CashfreeConfig = {
  cashfreeMode: "prod" | "sandbox";
  baseUrl: string;
};

export function CashfreeEnvironment() {
  const queryClient = useQueryClient();

  // GET current Cashfree config
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cashfree-config"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/cashfree-config");
      return res.data;
    },
  });

  // PATCH toggle mode (sandbox ↔ prod)
  const toggleMutation = useMutation({
    mutationFn: async (isProduction: boolean) => {
      const res = await axios.patch("/api/admin/cashfree-config", {
        isProduction,
      });
      return res.data;
    },

    // Instead of invalidating, we update cache manually
    onSuccess: (updatedData) => {
      queryClient.setQueryData(["cashfree-config"], (prev:CashfreeConfig) => ({
        ...prev,
        mode: updatedData.cashfreeMode,
        baseUrl:
          updatedData.cashfreeMode === "prod"
            ? process.env.NEXT_PUBLIC_CASHFREE_PROD_BASE_URL
            : process.env.NEXT_PUBLIC_CASHFREE_SANDBOX_BASE_URL,
      }));
    },
  });

  if (isLoading) {
    return <div className="text-sm">Loading Cashfree Environment...</div>;
  }

  if (isError) {
    return <div className="text-sm text-red-500">Error loading config</div>;
  }

  const mode = data?.mode ?? "sandbox";
  const isProduction = mode === "prod";

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
            {isProduction ? "Production" : "Sandbox"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Base URL</span>
          <span className="text-xs break-all text-muted-foreground">
            {data?.baseUrl}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">Toggle Environment</span>

          <Switch checked={isProduction} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
}
