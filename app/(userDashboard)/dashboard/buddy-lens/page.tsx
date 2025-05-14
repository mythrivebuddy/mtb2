"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BuddyLensRequest } from "@/types/claim";
import { LinkIcon, Trash2 } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { getAxiosErrorMessage } from "@/utils/ax";

interface Review {
  id: string;
  requestId: string;
  comments: string;
  rating: number;
  feedback: string;
  status: string;
  reviewText: string;
  answers: [];
  createdAt: string;
  request: {
    domain: string;
  };
  reviewer: {
    name: string;
    email: string;
  };
}

interface DeleteRequestResponse {
  message: string;
  data?: BuddyLensRequest;
}

interface DeleteRequestError {
  error: string;
  details?: string;
}

interface ClaimActionInput {
  requestId: string;
  action: "APPROVE" | "REJECT";
}

export default function BuddyLensDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState<
    "my-requests" | "to-review" | "reviewed"
  >("my-requests");
  const router = useRouter();

  // Fetch user's own requests
  const {
    data: myRequests = [],
    isLoading: isMyRequestsLoading,
    error: myRequestsError,
  } = useQuery({
    queryKey: ["buddyLensRequest", userId] as [string, string | undefined],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/buddy-lens/requester/${userId}`);
        console.log("Raw API Response (My Requests):", response.data); // Debug: Log raw response
        const filteredRequests = response.data.filter(
          (req: BuddyLensRequest) => {
            console.log("Request (My Requests):", req); // Debug: Log each request
            return req.requesterId === userId && !req.isDeleted;
          }
        );
        console.log("Filtered Requests (My Requests):", filteredRequests); // Debug: Log filtered result
        return filteredRequests;
      } catch (error) {
        console.error("Fetch error (My Requests):", error);
        throw error;
      }
    },
    enabled: !!userId,
  });

  // Fetch requests to review (other users' requests)
  const {
    data: reviewRequests = [],
    isLoading: isReviewRequestsLoading,
    error: reviewRequestsError,
  } = useQuery({
    queryKey: ["buddyLensRequestsToReview", userId] as [
      string,
      string | undefined,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/buddy-lens/requester");
      console.log("Requests to review:", response.data);
      return response.data.filter(
        (req: BuddyLensRequest) =>
          req.requesterId !== userId &&
          ["OPEN", "PENDING", "CLAIMED"].includes(req.status) &&
          !req.isDeleted
      );
    },
    enabled: !!userId,
  });

  // Fetch reviewed requests
  const {
    data: reviewedRequests = [],
    isLoading: isReviewedRequestsLoading,
    error: reviewedRequestsError,
  } = useQuery({
    queryKey: ["buddyLensReviewedRequests", userId] as [
      string,
      string | undefined,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/buddy-lens/reviewer");
      console.log("Reviewed Requests:", response.data);
      return response.data;
    },
    enabled: !!userId,
  });

  // Mutation for claiming a request
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
        ["buddyLensRequestsToReview", userId],
        (old: BuddyLensRequest[] | undefined) =>
          old?.map((req) =>
            req.id === requestId
              ? { ...req, status: "PENDING", pendingReviewerId: userId }
              : req
          )
      );
      queryClient.invalidateQueries({
        queryKey: ["buddyLensRequestsToReview"],
      });
    },
    onError: () => {
      toast.error("Failed to claim request");
    },
  });

  // Mutation for approving/rejecting a claim
  const claimActionMutation = useMutation({
    mutationFn: async ({ requestId, action }: ClaimActionInput) => {
      if (!session?.user?.id || !requestId) {
        throw new Error("Missing required information");
      }
      const approve = action === "APPROVE";
      const req = myRequests.find((r: BuddyLensRequest) => r.id === requestId);
      if (!req?.pendingReviewerId) {
        throw new Error("No pending reviewer for this request");
      }
      console.log("Sending: PATCH /api/buddy-lens/approve", {
        requestId,
        reviewerId: req.pendingReviewerId,
        approve,
      });
      const response = await axios.patch(
        "/api/buddy-lens/approve",
        {
          requestId,
          reviewerId: req.pendingReviewerId,
          approve,
          requesterId: session.user.id,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data;
    },
    onSuccess: (data, { action }) => {
      toast.success(
        data.message ||
          (action === "APPROVE"
            ? "Claim approved successfully"
            : "Claim rejected successfully")
      );
      queryClient.invalidateQueries({ queryKey: ["buddyLensRequest", userId] });
      router.push("/dashboard/buddy-lens");
    },
    onError: (error) => {
      const errorMessage = getAxiosErrorMessage(
        error,
        "Error processing claim"
      );
      toast.error(errorMessage);
    },
  });
  // Mutation for deleting a request
  const deleteRequestMutation = useMutation<
    DeleteRequestResponse,
    AxiosError<DeleteRequestError>,
    string,
    { previousRequests: BuddyLensRequest[] | undefined }
  >({
    mutationFn: async (requestId: string) => {
      const response = await axios.delete(
        `/api/buddy-lens/requester/${requestId}`
      );
      return response.data;
    },
    onMutate: async (requestId: string) => {
      // Cancel ongoing queries to avoid race conditions
      await queryClient.cancelQueries({
        queryKey: ["myBuddyLensRequests", userId],
      });

      // Snapshot the previous state
      const previousRequests = queryClient.getQueryData([
        "myBuddyLensRequests",
        userId,
      ]) as BuddyLensRequest[] | undefined;

      // Optimistically update the UI by removing the request
      queryClient.setQueryData(
        ["myBuddyLensRequests", userId],
        (old: BuddyLensRequest[] | undefined) =>
          old?.filter((req) => req.id !== requestId)
      );

      // Return context for rollback
      return { previousRequests };
    },
    onSuccess: () => {
      toast.success("Request deleted successfully");
    },
    onError: (error: AxiosError<DeleteRequestError>, requestId, context) => {
      // Rollback to previous state on error
      queryClient.setQueryData(
        ["myBuddyLensRequests", userId],
        context?.previousRequests
      );
      toast.error(error.response?.data?.error || "Failed to delete request");
    },
    onSettled: () => {
      // Invalidate queries to ensure fresh data
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["myBuddyLensRequests", userId],
        });
      }
    },
  });

  if (!userId) {
    return (
      <div className="text-center p-8">
        Please log in to use BuddyLens Dashboard.
      </div>
    );
  }

  if (myRequestsError || reviewRequestsError || reviewedRequestsError) {
    return (
      <div className="text-center p-8 text-red-600">
        Error:{" "}
        {myRequestsError?.message ||
          reviewRequestsError?.message ||
          reviewedRequestsError?.message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">BuddyLens Dashboard</h2>
          <NotificationBell />
        </div>

        {/* Tabs for section switching */}
        <Tabs
          value={tabValue}
          onValueChange={(value) =>
            setTabValue(value as "my-requests" | "to-review" | "reviewed")
          }
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="to-review">Requests to Review</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed Requests</TabsTrigger>
          </TabsList>

          {/* My Requests Section */}
          <TabsContent value="my-requests">
            <div className="space-y-4">
              <h3 className="text-xl font-medium">My Requests</h3>
              {isMyRequestsLoading ? (
                <p>Loading...</p>
              ) : myRequests.length === 0 ? (
                <p>No requests created.</p>
              ) : (
                myRequests.map((req: BuddyLensRequest) => (
                  <Card key={req.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-6">
                      <div className="space-y-1">
                        {req?.reviewer && (
                          <p className="text-sm text-gray-600 flex gap-1">
                            Claimed By: 
                            <a
                              href={`/profile/${req.reviewer.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 flex items-center gap-1 underline"
                            >
                             {"  "} {req?.reviewer?.name}
                            </a>
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Domain: {req.domain}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tier: {req.tier}
                        </p>
                        <p className="text-sm text-gray-600">
                          Reward: {req.jpCost} JoyPearls
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {req.status}
                        </p>
                        <a
                          href={req.socialMediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 flex items-center gap-1 text-sm"
                        >
                          <LinkIcon className="w-3 h-3" />
                          View Content
                        </a>
                        {/* {
                          req?.reviewer && (
                            <a
                              href={`/profile/${req.reviewer.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 flex items-center gap-1"
                            >
                              <LinkIcon className="w-4 h-4" />
                              View Profile
                            </a>
                          )
                        } */}
                      </div>
                      <div className="flex gap-2">
                        {req.status === "OPEN" && (
                          <Button
                            onClick={() => deleteRequestMutation.mutate(req.id)}
                            disabled={deleteRequestMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {req.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() =>
                                claimActionMutation.mutate({
                                  requestId: req.id,
                                  action: "APPROVE",
                                })
                              }
                              disabled={claimActionMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                claimActionMutation.mutate({
                                  requestId: req.id,
                                  action: "REJECT",
                                })
                              }
                              disabled={claimActionMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Requests to Review Section */}
          <TabsContent value="to-review">
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Requests to Review</h3>
              {isReviewRequestsLoading ? (
                <p>Loading...</p>
              ) : reviewRequests.length === 0 ? (
                <p>No requests available to review.</p>
              ) : (
                reviewRequests.map((req: BuddyLensRequest) => {
                  return (
                    <Card key={req.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-6">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Requester Name: {req?.requester?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Domain: {req.domain}
                          </p>
                          <p className="text-sm text-gray-600">
                            Tier: {req.tier}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reward: {req.jpCost} JoyPearls
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: {req.status}
                          </p>
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
                            (req.review.filter(
                              (r) => r.reviewer.id === userId
                            )[0]?.status !== "PENDING" && (
                              <Button
                                onClick={() =>
                                  claimRequestMutation.mutate(req.id)
                                }
                                disabled={claimRequestMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Claim Request
                              </Button>
                            ))}
                          {req.review &&
                            req.review.filter(
                              (r) => r.reviewer.id === userId
                            )[0]?.status === "PENDING" && (
                              <Button
                                disabled
                                className="bg-gray-400 cursor-not-allowed"
                              >
                                Pending Approval
                              </Button>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Reviewed Requests Section */}
          <TabsContent value="reviewed">
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Reviewed Requests</h3>
              {isReviewedRequestsLoading ? (
                <p>Loading...</p>
              ) : reviewedRequests.length === 0 ? (
                <p>No reviewed requests.</p>
              ) : (
                reviewedRequests.map((review: Review) => {
                  const request =
                    reviewRequests.find(
                      (r: BuddyLensRequest) => r.id === review.requestId
                    ) ||
                    myRequests.find(
                      (r: BuddyLensRequest) => r.id === review.requestId
                    );
                  return (
                    <Card key={review.id} className="p-4 space-y-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {review.request?.domain || "Unknown Request"}
                        </p>
                        <a
                          href={request?.socialMediaUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 flex items-center gap-1 text-sm"
                        >
                          <LinkIcon className="w-3 h-3" />
                          View Content
                        </a>
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <p className="text-sm">
                            <strong>Reviewer Name: </strong>{" "}
                            {review.reviewer.name}
                          </p>
                          <p className="text-sm">
                            <strong>Domain: </strong>
                            {review?.request?.domain}
                          </p>
                          <p className="text-sm">
                            <strong>Rating: </strong> ⭐ {review.rating}/5
                          </p>
                          <p className="text-sm">
                            <strong>Feedback: </strong> {review.feedback}
                          </p>
                          <p className="text-sm">
                            <strong>Review Text: </strong> {review.reviewText}
                          </p>
                          <p className="text-sm">
                            <strong>Status: </strong> {review.status}
                          </p>
                          {review.answers.length > 0 ? (
                            <ul className="list-disc">
                              <strong>Answers: </strong>
                              {review.answers.map((answer, index) => (
                                <li key={index} className="ml-7">
                                  {answer}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "No answers provided"
                          )}
                          <p className="text-sm text-gray-600">
                            <strong>Reviewed on: </strong>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
