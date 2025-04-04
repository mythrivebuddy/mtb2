"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmAction from "@/components/ConfirmAction";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Prisma, SpotlightStatus } from "@prisma/client";
import JPCard from "@/components/dashboard/JPCard";
import RightPanel from "@/components/dashboard/user/RightPanel";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const { data: spotlights, isLoading } = useQuery<
    Prisma.SpotlightGetPayload<{ include: { user: true } }>[]
  >({
    queryKey: ["spotlight", session?.user?.id],
    queryFn: async () => {
      const response = await axios.get(`/api/user/spotlight`);
      return response.data;
    },
    retry: false,
    enabled: !!session?.user?.id,
  });

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await axios.get("/api/user");
      return response.data.user;
    },
    retry: false,
  });

  console.log(spotlights);

  const createSpotlight = async () => {
    const response = await axios.post("/api/user/spotlight", {
      userId: session?.user?.id,
    });
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: createSpotlight,
    onSuccess: (data) => {
      console.log(data);
      toast.success("Spotlight application submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["spotlight"] });
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error));
    },
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-8">
        {/* Main Dashboard Content */}
        <div className="flex-[3]">
          <div className="grid grid-cols-3 gap-4">
            <JPCard value={userData?.jpEarned || 0} label="Total JP Earned" />
            <JPCard value={userData?.jpSpent || 0} label="Total JP Spent" />
            <JPCard value={userData?.jpBalance || 0} label="JP Balance" />
          </div>
          <p className="mt-4">Welcome to your dashboard!</p>

          <ConfirmAction
            action={() => mutation.mutate()}
            isDisabled={
              mutation.isPending ||
              (spotlights &&
                spotlights.some((spotlight) =>
                  ["APPLIED", "IN_REVIEW", "APPROVED", "ACTIVE"].includes(
                    spotlight.status
                  )
                ))
            }
          >
            <Button
              disabled={
                status === "loading" ||
                mutation.isPending ||
                (spotlights &&
                  spotlights.some((spotlight) =>
                    ["APPLIED", "IN_REVIEW", "APPROVED", "ACTIVE"].includes(
                      spotlight.status
                    )
                  ))
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Apply for Spotlight
            </Button>
          </ConfirmAction>

          {isLoading ? (
            <p className="mt-4">Loading spotlight status...</p>
          ) : (
            spotlights &&
            spotlights.length > 0 && (
              <div className="mt-4 space-y-4">
                {spotlights.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border-black border"
                  >
                    <h2 className="text-xl font-semibold">Spotlight Entry</h2>
                    <p className="mt-2">
                      Status:{" "}
                      {entry.status === SpotlightStatus.ACTIVE
                        ? "ACTIVE"
                        : entry.status ?? "N/A"}
                    </p>
                    <p className="mt-1">
                      Applied on:{" "}
                      {new Date(entry.appliedAt).toLocaleDateString()}
                    </p>
                    {entry.status === SpotlightStatus.EXPIRED &&
                      entry.expiresAt && (
                        <p className="mt-1">
                          Expired on:{" "}
                          {new Date(entry?.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Divider Between Main and Right Panel */}
        <div className="h-screen w-0.5 bg-gray-300 dark:bg-brown-500 self-stretch"></div>

        {/* Right Panel */}
        <div className="flex-[1.1]">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
