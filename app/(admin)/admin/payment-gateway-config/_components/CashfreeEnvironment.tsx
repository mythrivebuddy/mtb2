"use client";

import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

    onSuccess: (updated) => {
      queryClient.setQueryData(["payment-config"], (prev: any) => ({
        ...prev,
        cashfree: {
          mode: updated.cashfreeMode,
          baseUrl:
            updated.cashfreeMode === "prod"
              ? process.env.NEXT_PUBLIC_CASHFREE_PROD_BASE_URL
              : process.env.NEXT_PUBLIC_CASHFREE_SANDBOX_BASE_URL,
        },
      }));
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
            {isProduction ? "Production" : "Sandbox"}
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
          <Switch checked={isProduction} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
}