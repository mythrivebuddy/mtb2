"use client";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmAction from "@/components/ConfirmAction";
import { getAxiosErrorMessage } from "@/utils/ax";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const createSpotlight = async () => {
    const response = await axios.post("/api/user/spotLight", {
      userId: session?.user?.id,
    });
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: createSpotlight,
    onSuccess: (data) => {
      console.log(data);
      toast.success("Spotlight application submitted successfully");
    },
    onError: (error) => {
      console.log(error);
      toast.error(getAxiosErrorMessage(error));
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome to your dashboard!</p>
      <ConfirmAction
        action={() => mutation.mutate()}
        isDisabled={mutation.isPending}
      >
        <Button
          disabled={status === "loading" || mutation.isPending}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Apply for Spotlight
        </Button>
      </ConfirmAction>
    </div>
  );
}
