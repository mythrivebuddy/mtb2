"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import { BuddyLensRequest } from "@/types/claim";

interface Props {
  userId: string;
}

export default function AvailableRequest({ userId }: Props) {
  const queryClient = useQueryClient();

  const {
    data: reviewRequests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["buddyLensAvailableRequest", userId],
    queryFn: async () => {
      const response = await axios.get("/api/buddy-lens/requester");
      return response.data.filter(
        (req: BuddyLensRequest) =>
          req.requesterId !== userId &&
          ["OPEN", "PENDING", "CLAIMED"].includes(req.status) &&
          !req.isDeleted
      );
    },
    enabled: !!userId,
  });

  const claimRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await axios.patch("/api/buddy-lens/reviewer", {
        requestId,
        reviewerId: userId,
      });
    },
    onSuccess: (_, requestId) => {
      toast.success("Claim request sent for approval");
      queryClient.setQueryData(
        ["buddyLensAvailableRequest", userId],
        (old: BuddyLensRequest[] | undefined) =>
          old?.map((req) =>
            req.id === requestId
              ? { ...req, status: "PENDING", pendingReviewerId: userId }
              : req
          )
      );
      queryClient.invalidateQueries({
        queryKey: ["buddyLensAvailableRequest"],
      });
    },
    onError: () => {
      toast.error("Failed to claim request");
    },
  });

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">Error: {error.message}</div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-gray-700">List of all profile audit requests in the system</p>
      {isLoading ? (
        <p>Loading...</p>
      ) : reviewRequests.length === 0 ? (
        <p>No requests available to review.</p>
      ) : (
        reviewRequests.map((req: BuddyLensRequest) => (
          <Card key={req.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Requester Name: {req?.requester?.name}
                </p>
                <p className="text-sm text-gray-600">Domain: {req.domain}</p>
                <p className="text-sm text-gray-600">Tier: {req.tier}</p>
                <p className="text-sm text-gray-600">
                  Reward: {req.jpCost} JoyPearls
                </p>
                <p className="text-sm text-gray-600">Status: {req.status}</p>
                <a
                  href={req.socialMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 flex items-center gap-1 text-sm"
                >
                  <LinkIcon className="w-3 h-3" />
                  View Content
                </a>
                <a
                  href={`/profile/${req.requester?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 flex items-center gap-1 text-sm"
                >
                  <LinkIcon className="w-3 h-3" />
                  View Profile
                </a>
              </div>
              <div className="flex flex-col gap-2">
                {!req.review ||
                  (req.review.filter((r) => r.reviewer.id === userId)[0]
                    ?.status !== "PENDING" && (
                    <Button
                      onClick={() => claimRequestMutation.mutate(req.id)}
                      disabled={claimRequestMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Claim Request
                    </Button>
                  ))}
                {req.review &&
                  req.review.filter((r) => r.reviewer.id === userId)[0]
                    ?.status === "PENDING" && (
                    <Button disabled className="bg-gray-400 cursor-not-allowed">
                      Pending Approval
                    </Button>
                  )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
