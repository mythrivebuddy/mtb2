"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Send, Star, LinkIcon, FileQuestion, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { BuddyLensReviewStatus, Prisma } from "@prisma/client";
import { BuddyLensReview } from "@/types/claim";

// interface BuddyLensRequest {
//   id: string;
//   feedbackType: string;
//   domain: string;
//   tier: string;
//   jpCost: number;
//   status: string;
//   socialMediaUrl: string;
//   requesterId: string;
//   reviewerId?: string;
//   pendingReviewerId?: string;
//   isDeleted: boolean;
//   questions: string[];
//   reviewerName: string;
//   expiresAt?: string; // Add expiresAt field
// }

type BuddyLensRequest = Prisma.BuddyLensRequestGetPayload<{
  include: { reviewer: true };
}> & {
  feedbackType: string;
  pendingReviewerId?: string; // Add pendingReviewerId property
};

// interface Review {
//   id: string;
//   name: string;
//   requestId: string;
//   reviewerId: string;
//   request: {
//     domain: string;
//     name: string;
//   };
//   feedback: string;
//   rating: number;
//   reviewText: string;
//   answers: string[];
// }

type Review = Prisma.BuddyLensReviewGetPayload<{
  include: { request: true; reviewer: true };
}>;

export default function BuddyLensReviewPage() {
  const { data: session } = useSession();
  const reviewerId = session?.user?.id;
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  // Local UI state
  const [answers, setAnswers] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [ratingError, setRatingError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();

  // Fetch requests
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useQuery({
    queryKey: ["buddyLensRequests", reviewerId],
    queryFn: async () => {
      const response = await axios.get(`/api/buddy-lens/requester`);
      return response.data.filter(
        (req: BuddyLensRequest) =>
          ["OPEN", "PENDING", "CLAIMED"].includes(req.status) &&
          !req.isDeleted &&
          req.requesterId !== reviewerId
      );
    },
    enabled: !!reviewerId,
    // refetchInterval: 10000, // Poll every 10 seconds
  });

  // Fetch notifications
  const {
    // data: notifications = [],
    isLoading: isNotificationsLoading,
    error: notificationsError,
  } = useQuery({
    queryKey: ["buddyLensNotifications", reviewerId],
    queryFn: async () => {
      const response = await axios.get(`/api/buddy-lens/notifications`, {
        params: { userId: reviewerId },
      });
      return response.data;
    },
    enabled: !!reviewerId,
    refetchInterval: 10000,
  });

  // Fetch reviewed requests
  const {
    data: reviewedRequests = [],
    isLoading: isReviewedRequestsLoading,
    error: reviewedRequestsError,
  } = useQuery({
    queryKey: ["buddyLensReviewedRequests", reviewerId],
    queryFn: async () => {
      const response = await axios.get(`/api/buddy-lens/reviewer`, {
        params: { reviewerId },
      });
      return response.data;
    },
    enabled: !!reviewerId,
    refetchInterval: 10000,
  });

  // Fetch selected request based on requestId from URL
  const {
    data: selectedRequest,
    isLoading: isSelectedRequestLoading,
    error: selectedRequestError,
  } = useQuery<BuddyLensReview>({
    queryKey: ["buddyLensSelectedRequest", requestId, reviewerId],
    queryFn: async () => {
      if (!requestId) return null;
      const response = await axios.get(
        `/api/buddy-lens/approve?requestId=${requestId}&status=${BuddyLensReviewStatus.APPROVED}`
      );
      if (
        response.data &&
        response.data.status === "APPROVED" &&
        response.data.reviewerId === reviewerId
      ) {
        return response.data;
      }
      return null;
    },
    enabled: !!requestId && !!reviewerId,
  });

  useEffect(() => {
    console.log("selectedRequest", selectedRequest);
  });

  // Initialize timer when reviewer opens the form without backend changes
  useEffect(() => {
    if (selectedRequest) {
      // Set initial timer based on tier (in seconds)
      let initialTime;
      switch (selectedRequest.request.tier) {
        case "10min":
          initialTime = 10 * 60; // 10 minutes
          break;
        case "15min":
          initialTime = 15 * 60; // 15 minutes
          break;
        default:
          initialTime = 5 * 60; // 5 minutes (BASIC tier)
      }

      // Store start time in sessionStorage to persist across page refreshes
      const startTimeKey = `review_start_time_${selectedRequest.id}`;
      let startTime = sessionStorage.getItem(startTimeKey);

      if (!startTime) {
        // First time opening the form
        startTime = Date.now().toString();
        sessionStorage.setItem(startTimeKey, startTime);
      }

      // Calculate time elapsed and remaining
      let timerInterval: string | number | NodeJS.Timeout | undefined;
      const calculateRemaining = () => {
        const elapsed = Math.floor(
          (Date.now() - parseInt(startTime as string)) / 1000
        );
        const remaining = Math.max(0, initialTime - elapsed);


        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setIsExpired(true);
          clearInterval(timerInterval);
        } else {
          setIsExpired(false);
        }
      };

      // Calculate immediately and start interval
      calculateRemaining();
      timerInterval = setInterval(calculateRemaining, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [selectedRequest]);

  // Function to update timer

  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return "--:--";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Mutation for claiming a request
  const claimRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!reviewerId) {
        throw new Error("User ID not found");
      }
      await axios.patch(`/api/buddy-lens/reviewer`, {
        requestId,
        reviewerId,
      });
    },
    onSuccess: (_, requestId) => {
      toast.success("Claim request submitted, awaiting approval");
      queryClient.setQueryData(
        ["buddyLensRequests", reviewerId],
        (old: BuddyLensRequest[] | undefined) =>
          old?.map((req) =>
            req.id === requestId
              ? { ...req, status: "PENDING", pendingReviewerId: reviewerId }
              : req
          )
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to claim request");
    },
  });

  // Mutation for submitting a review
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (isExpired) {
        throw new Error("Time expired! You can no longer submit this review.");
      }

      if (
        !selectedRequest ||
        !reviewText ||
        !rating ||
        answers.some((a) => !a.trim())
      ) {
        throw new Error("Please fill in all fields");
      }

      // No schema changes needed - just using the existing API
      await axios.post("/api/buddy-lens/reviewer", {
        action: "submit-review",
        requestId: selectedRequest.request.id,
        reviewerId,
        answers,
        reviewText,
        rating,
        feedback,
        status: "SUBMITTED",
      });

      // Clear the timer from sessionStorage after successful submission
      sessionStorage.removeItem(`review_start_time_${selectedRequest.id}`);
    },
    onSuccess: () => {
      toast.success(
        `Review submitted successfully! You earned ${selectedRequest?.request.jpCost} JoyPearls.`
      );
      setAnswers([]);
      setReviewText("");
      setRating(null);
      setFeedback("");
      queryClient.setQueryData(
        ["buddyLensRequests", reviewerId],
        (old: BuddyLensRequest[] | undefined) =>
          old?.filter((req) => req.id !== selectedRequest?.id)
      );
      queryClient.invalidateQueries({
        queryKey: ["buddyLensSelectedRequest", requestId, reviewerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["buddyLensReviewedRequests", reviewerId],
      });
      queryClient.invalidateQueries({ queryKey: ["userInfo"] }); // Refetch user data
      router.push("/dashboard/buddy-lens");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  // Initialize answers when selectedRequest changes
  useEffect(() => {
    if (selectedRequest) {
      setAnswers(selectedRequest?.request.questions?.map(() => ""));
    }
  }, [selectedRequest]);

  if (!reviewerId) {
    toast.error("User not logged in");
    return <div>Please log in to view requests.</div>;
  }

  if (
    requestsError ||
    notificationsError ||
    reviewedRequestsError ||
    selectedRequestError
  ) {
    return (
      <div className="text-center p-8 text-red-600">
        Error:{" "}
        {requestsError?.message ||
          notificationsError?.message ||
          reviewedRequestsError?.message ||
          selectedRequestError?.message}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg p-6 space-y-6">
        <h2 className="text-3xl font-semibold text-center">👀 Review Page</h2>

        {isRequestsLoading ||
        isNotificationsLoading ||
        isReviewedRequestsLoading ||
        isSelectedRequestLoading ? (
          <p>Loading...</p>
        ) : !selectedRequest ? (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Open Requests</h3>
            {requests.length === 0 && <p>No open requests available.</p>}
            {requests.map((req: BuddyLensRequest) => (
              <Card key={req.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{req.feedbackType}</p>
                    <p className="text-sm text-gray-600">{req.domain}</p>
                    <p className="text-sm text-gray-600">Tier: {req.tier}</p>
                    <p className="text-sm text-gray-600">
                      Reward: {req.jpCost} JoyPearls
                    </p>
                    <p className="text-sm text-gray-600">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      Time Limit:{" "}
                      {req.tier === "PREMIUM"
                        ? "10 minutes"
                        : req.tier === "ENTERPRISE"
                          ? "15 minutes"
                          : "5 minutes"}
                    </p>
                    <a
                      href={req.socialMediaUrl}
                      target="_blank"
                      className="text-blue-600 flex items-center gap-1"
                    >
                      <LinkIcon className="w-4 h-4" /> View Content
                    </a>
                  </div>
                  <Button
                    onClick={() => claimRequestMutation.mutate(req.id)}
                    disabled={
                      req.status === "PENDING" ||
                      req.status === "CLAIMED" ||
                      claimRequestMutation.isPending
                    }
                    className={
                      req.status === "PENDING" || req.status === "CLAIMED"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  >
                    {req.status === "PENDING" &&
                    req.pendingReviewerId === reviewerId
                      ? "Pending Approval"
                      : req.status === "CLAIMED"
                        ? "Claimed"
                        : "Claim Request"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* <h3 className="text-xl font-medium">
              Review: {selectedRequest.request.feedbackType}
            </h3> */}

            {/* Timer Section */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Time Remaining:</span>
              </div>
              <div
                className={`font-mono font-bold text-lg ${isExpired ? "text-red-600" : timeRemaining && timeRemaining < 60 ? "text-orange-600" : "text-blue-600"}`}
              >
                {formatTimeRemaining()}
              </div>
            </div>

            {isExpired && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Time Expired!</p>
                <p>
                  You can no longer submit this review. Please claim a new
                  request.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="w-4 h-4" />
                Social Media URL
              </label>
              <a
                href={selectedRequest.request.socialMediaUrl}
                target="_blank"
                className="text-blue-600"
              >
                {selectedRequest.request.socialMediaUrl}
              </a>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <FileQuestion className="w-4 h-4" />
                Answer Questions
              </label>
              {selectedRequest?.request?.questions?.map((q: string, index: number) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm">{q}</p>
                  <Textarea
                    placeholder={`Answer ${index + 1}`}
                    value={answers[index] || ""}
                    onChange={(e) => {
                      const updated = [...answers];
                      updated[index] = e.target.value;
                      setAnswers(updated);
                    }}
                    disabled={isExpired}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Eye className="w-4 h-4" />
                Review Text
              </label>
              <Textarea
                placeholder="Write your review here"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={isExpired}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Star className="w-4 h-4" />
                Rating (1-5)
              </label>
              <Input
                type="number"
                min={1}
                max={5}
                value={rating || ""}
                onChange={(e) => {
                  const newRating = Number(e.target.value);
                  if (newRating > 5) {
                    setRatingError("Rating cannot be greater than 5!");
                  } else if (newRating >= 1 && newRating <= 5) {
                    setRating(newRating);
                    setRatingError("");
                  } else {
                    setRatingError("Rating must be between 1 and 5.");
                  }
                }}
                disabled={isExpired}
              />
              {ratingError && (
                <p className="text-red-500 text-sm">{ratingError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Send className="w-4 h-4" />
                Additional Feedback
              </label>
              <Textarea
                placeholder="Optional feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isExpired}
              />
            </div>

            <Button
              onClick={() => submitReviewMutation.mutate()}
              disabled={submitReviewMutation.isPending || isExpired}
              className={`w-full text-white ${isExpired ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {submitReviewMutation.isPending
                ? "Submitting..."
                : isExpired
                  ? "Time Expired"
                  : "Submit Review"}
            </Button>
          </div>
        )}

        {!selectedRequest && (
          <div className="space-y-4 mt-6">
            <h3 className="text-xl font-medium">Reviewed Requests</h3>
            {isReviewedRequestsLoading ? (
              <p>Loading reviewed requests...</p>
            ) : reviewedRequests.length === 0 ? (
              <p>No reviewed requests available.</p>
            ) : (
              reviewedRequests.map((review: Review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p>
                        <strong>Reviewer Profile:</strong>{" "}
                        <a
                          href={`http://localhost:3000/profile/${review.reviewerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600"
                        >
                          Click here to view
                        </a>
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">
                          Reviewer Name:
                        </span>{" "}
                        {review.reviewer.name}
                      </p>

                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">
                          Request Domain:
                        </span>{" "}
                        {review.request.domain}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">
                          Feedback:
                        </span>{" "}
                        {review.feedback}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">Rating:</span>{" "}
                        {review.rating}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">
                          Review Text:
                        </span>{" "}
                        {review.reviewText}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">Answers:</span>
                      </p>
                      <ul className="list-disc pl-6 text-sm text-gray-600">
                        {review.answers.map((answer: string, index: number) => (
                          <li key={index}>{answer}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useSession } from 'next-auth/react';
// import { useSearchParams } from 'next/navigation';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Textarea } from '@/components/ui/textarea';
// import { Eye, Send, Star, LinkIcon, FileQuestion } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// interface BuddyLensRequest {
//   id: string;
//   feedbackType: string;
//   domain: string;
//   tier: string;
//   jpCost: number;
//   status: string;
//   socialMediaUrl: string;
//   requesterId: string;
//   reviewerId?: string;
//   pendingReviewerId?: string;
//   isDeleted: boolean;
//   questions: string[];
//   reviewerName: string;
// }

// interface Review {
//   id: string;
//   requestId: string;
//   reviewerId: string;
//   request: {
//     domain: string;
//   };
//   feedback: string;
//   rating: number;
//   reviewText: string;
//   answers: string[];
// }

// export default function BuddyLensReviewPage() {
//   const { data: session } = useSession();
//   const reviewerId = session?.user?.id;
//   const queryClient = useQueryClient();
//   const searchParams = useSearchParams();
//   const requestId = searchParams.get('requestId');

//   // Local UI state
//   const [answers, setAnswers] = useState<string[]>([]);
//   const [reviewText, setReviewText] = useState('');
//   const [rating, setRating] = useState<number | null>(null);
//   const [feedback, setFeedback] = useState('');
//   const [ratingError, setRatingError] = useState<string>('');
//   const router = useRouter();

//   // Fetch requests
//   const {
//     data: requests = [],
//     isLoading: isRequestsLoading,
//     error: requestsError,
//   } = useQuery({
//     queryKey: ['buddyLensRequests', reviewerId],
//     queryFn: async () => {
//       const response = await axios.get(`/api/buddy-lens/requester`);
//       return response.data.filter(
//         (req: BuddyLensRequest) =>
//           ['OPEN', 'PENDING', 'CLAIMED'].includes(req.status) &&
//           !req.isDeleted &&
//           req.requesterId !== reviewerId
//       );
//     },
//     enabled: !!reviewerId,
//     refetchInterval: 10000, // Poll every 10 seconds
//   });

//   // Fetch notifications
//   const {
//     // data: notifications = [],
//     isLoading: isNotificationsLoading,
//     error: notificationsError,
//   } = useQuery({
//     queryKey: ['buddyLensNotifications', reviewerId],
//     queryFn: async () => {
//       const response = await axios.get(`/api/buddy-lens/notifications`, {
//         params: { userId: reviewerId },
//       });
//       return response.data;
//     },
//     enabled: !!reviewerId,
//     refetchInterval: 10000,
//   });

//   // Fetch reviewed requests
//   const {
//     data: reviewedRequests = [],
//     isLoading: isReviewedRequestsLoading,
//     error: reviewedRequestsError,
//   } = useQuery({
//     queryKey: ['buddyLensReviewedRequests', reviewerId],
//     queryFn: async () => {
//       const response = await axios.get(`/api/buddy-lens/reviewer`, {
//         params: { reviewerId },
//       });
//       // console.log("Reviewer name: ", reviewerName);
//       return response.data;
//     },
//     enabled: !!reviewerId,
//     refetchInterval: 10000,
//   });

//   // Fetch selected request based on requestId from URL
//   const {
//     data: selectedRequest,
//     isLoading: isSelectedRequestLoading,
//     error: selectedRequestError,
//   } = useQuery({
//     queryKey: ['buddyLensSelectedRequest', requestId, reviewerId],
//     queryFn: async () => {
//       if (!requestId) return null;
//       const response = await axios.get(`/api/buddy-lens/approve?requestId=${requestId}`);
//       if (
//         response.data &&
//         response.data.status === 'CLAIMED' &&
//         response.data.reviewerId === reviewerId
//       ) {
//         return response.data;
//       }
//       return null;
//     },
//     enabled: !!requestId && !!reviewerId,
//   });

//   // Mutation for claiming a request
//   const claimRequestMutation = useMutation({
//     mutationFn: async (requestId: string) => {
//       if (!reviewerId) {
//         throw new Error('User ID not found');
//       }
//       await axios.patch(`/api/buddy-lens/reviewer`, {
//         requestId,
//         reviewerId,
//       });
//     },
//     onSuccess: (_, requestId) => {
//       toast.success('Claim request submitted, awaiting approval');
//       queryClient.setQueryData(['buddyLensRequests', reviewerId], (old: BuddyLensRequest[] | undefined) =>
//         old?.map((req) =>
//           req.id === requestId ? { ...req, status: 'PENDING', pendingReviewerId: reviewerId } : req
//         )
//       );
//     },
//     onError: (error) => {
//       toast.error(error.message || 'Failed to claim request');
//     },
//   });

//   // Mutation for submitting a review
//   const submitReviewMutation = useMutation({
//     mutationFn: async () => {
//       if (!selectedRequest || !reviewText || !rating || answers.some((a) => !a.trim())) {
//         throw new Error('Please fill in all fields');
//       }
//       await axios.post('/api/buddy-lens/reviewer', {
//         action: 'submit-review',
//         requestId: selectedRequest.id,
//         reviewerId,
//         answers,
//         reviewText,
//         rating,
//         feedback,
//         status: 'SUBMITTED',
//       });
//     },
//     onSuccess: () => {
//       toast.success(`Review submitted successfully! You earned ${selectedRequest?.jpCost} JoyPearls.`);
//       setAnswers([]);
//       setReviewText('');
//       setRating(null);
//       setFeedback('');
//       queryClient.setQueryData(['buddyLensRequests', reviewerId], (old: BuddyLensRequest[] | undefined) =>
//         old?.filter((req) => req.id !== selectedRequest?.id)
//       );
//       queryClient.invalidateQueries({ queryKey: ['buddyLensSelectedRequest', requestId, reviewerId] });
//       queryClient.invalidateQueries({ queryKey: ['buddyLensReviewedRequests', reviewerId] });
//       queryClient.invalidateQueries({ queryKey: ["userInfo"] }); // Refetch user data
//       router.push("/dashboard/buddy-lens")
//     },
//     onError: (error) => {
//       toast.error(error.message || 'Failed to submit review');
//     },
//   });

//   // Initialize answers when selectedRequest changes
//   useEffect(() => {
//     if (selectedRequest) {
//       setAnswers(selectedRequest.questions.map(() => ''));
//     }
//   }, [selectedRequest]);

//   if (!reviewerId) {
//     toast.error('User not logged in');
//     return <div>Please log in to view requests.</div>;
//   }

//   if (requestsError || notificationsError || reviewedRequestsError || selectedRequestError) {
//     return (
//       <div className="text-center p-8 text-red-600">
//         Error: {requestsError?.message || notificationsError?.message || reviewedRequestsError?.message || selectedRequestError?.message}
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <h2 className="text-3xl font-semibold text-center">👀 Review Page</h2>

//         {isRequestsLoading || isNotificationsLoading || isReviewedRequestsLoading || isSelectedRequestLoading ? (
//           <p
//           >Loading...</p>
//         ) : !selectedRequest ? (
//           <div className="space-y-4">
//             <h3 className="text-xl font-medium">Open Requests</h3>
//             {requests.length === 0 && <p>No open requests available.</p>}
//             {requests.map((req: BuddyLensRequest) => (
//               <Card key={req.id} className="p-4">
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <p className="font-medium">{req.feedbackType}</p>
//                     <p className="text-sm text-gray-600">{req.domain}</p>
//                     <p className="text-sm text-gray-600">Tier: {req.tier}</p>
//                     <p className="text-sm text-gray-600">Reward: {req.jpCost} JoyPearls</p>
//                     <a
//                       href={req.socialMediaUrl}
//                       target="_blank"
//                       className="text-blue-600 flex items-center gap-1"
//                     >
//                       <LinkIcon className="w-4 h-4" /> View Content
//                     </a>
//                   </div>
//                   <Button
//                     onClick={() => claimRequestMutation.mutate(req.id)}
//                     disabled={req.status === 'PENDING' || req.status === 'CLAIMED' || claimRequestMutation.isPending}
//                     className={
//                       req.status === 'PENDING' || req.status === 'CLAIMED'
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-blue-600 hover:bg-blue-700'
//                     }
//                   >
//                     {req.status === 'PENDING' && req.pendingReviewerId === reviewerId
//                       ? 'Pending Approval'
//                       : req.status === 'CLAIMED'
//                       ? 'Claimed'
//                       : 'Claim Request'}
//                   </Button>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <div className="space-y-6">
//             <h3 className="text-xl font-medium">Review: {selectedRequest.feedbackType}</h3>
//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <LinkIcon className="w-4 h-4" />
//                 Social Media URL
//               </label>
//               <a href={selectedRequest.socialMediaUrl} target="_blank" className="text-blue-600">
//                 {selectedRequest.socialMediaUrl}
//               </a>
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <FileQuestion className="w-4 h-4" />
//                 Answer Questions
//               </label>
//               {selectedRequest.questions.map((q: string, index: number) => (
//                 <div key={index} className="space-y-1">
//                   <p className="text-sm">{q}</p>
//                   <Textarea
//                     placeholder={`Answer ${index + 1}`}
//                     value={answers[index] || ''}
//                     onChange={(e) => {
//                       const updated = [...answers];
//                       updated[index] = e.target.value;
//                       setAnswers(updated);
//                     }}
//                   />
//                 </div>
//               ))}
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <Eye className="w-4 h-4" />
//                 Review Text
//               </label>
//               <Textarea
//                 placeholder="Write your review here"
//                 value={reviewText}
//                 onChange={(e) => setReviewText(e.target.value)}
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <Star className="w-4 h-4" />
//                 Rating (1-5)
//               </label>
//               <Input
//                 type="number"
//                 min={1}
//                 max={5}
//                 value={rating || ''}
//                 onChange={(e) => {
//                   const newRating = Number(e.target.value);
//                   if (newRating > 5) {
//                     setRatingError('Rating cannot be greater than 5!');
//                   } else if (newRating >= 1 && newRating <= 5) {
//                     setRating(newRating);
//                     setRatingError('');
//                   } else {
//                     setRatingError('Rating must be between 1 and 5.');
//                   }
//                 }}
//               />
//               {ratingError && <p className="text-red-500 text-sm">{ratingError}</p>}
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <Send className="w-4 h-4" />
//                 Additional Feedback
//               </label>
//               <Textarea
//                 placeholder="Optional feedback"
//                 value={feedback}
//                 onChange={(e) => setFeedback(e.target.value)}
//               />
//             </div>

//             <Button
//               onClick={() => submitReviewMutation.mutate()}
//               disabled={submitReviewMutation.isPending}
//               className="w-full bg-blue-600 hover:bg-blue-700 text-white"
//             >
//               {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
//             </Button>
//           </div>
//         )}

//         {!selectedRequest && (
//           <div className="space-y-4 mt-6">
//             <h3 className="text-xl font-medium">Reviewed Requests</h3>
//             {isReviewedRequestsLoading ? (
//               <p>Loading reviewed requests...</p>
//             ) : reviewedRequests.length === 0 ? (
//               <p>No reviewed requests available.</p>
//             ) : (
//               reviewedRequests.map((review: Review) => (
//                 <Card key={review.id} className="p-4">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       {/* <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Reviewer Name:</span> {user.reviewer.name}
//                       </p> */}

//                       <p>
//                         <strong>Reviewer Profile:</strong>{' '}
//                         <a
//                           href={`http://localhost:3000/profile/${review.reviewerId}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-600"
//                         >
//                           Click here to view
//                         </a>
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Request Domain:</span> {review.request.domain}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Feedback:</span> {review.feedback}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Rating:</span> {review.rating}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Review Text:</span> {review.reviewText}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                             <span className="font-medium text-black">Answers:</span>
//                       </p>
//                       <ul className="list-disc pl-6 text-sm text-gray-600">
//                         {review.answers.map((answer: string, index: number) => (
//                           <li key={index}>{answer}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   </div>
//                 </Card>
//               ))
//             )}
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// }

// 'use client';

// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Textarea } from '@/components/ui/textarea';
// import { useSession } from 'next-auth/react';
// import {
//   Eye,
//   Send,
//   Star,
//   LinkIcon,
//   FileQuestion,
// } from 'lucide-react';

// export default function BuddyLensReviewPage() {
//   const [requests, setRequests] = useState<any[]>([]);
//   const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
//   const [answers, setAnswers] = useState<string[]>([]);
//   const [reviewText, setReviewText] = useState('');
//   const [rating, setRating] = useState<number | null>(null);
//   const [feedback, setFeedback] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [notifications, setNotifications] = useState<any[]>([]);
//   const [reviewedRequests, setReviewedRequests] = useState<any[]>([]); // New state to store reviewed requests
//   const { data: session } = useSession();
//   const [ratingError, setRatingError] = useState<string>(''); // Error state to store error message

//   const reviewerId = session?.user?.id;

//   if (!reviewerId) {
//     toast.error('User not logged in');
//     return <div>Please log in to view requests.</div>;
//   }

//   // Fetch requests and notifications
//   useEffect(() => {
//     const fetchRequests = async () => {
//       try {
//         const response = await axios.get('/api/buddy-lens/requester');
//         const filteredRequests = response.data.filter(
//           (req: any) =>
//             (req.status === 'OPEN' || req.status === 'PENDING' || req.status === 'CLAIMED') &&
//             !req.isDeleted &&
//             req.requesterId !== reviewerId
//         );
//         setRequests(filteredRequests);
//       } catch (err) {
//         toast.error('Failed to fetch requests');
//         console.log("Error:",err);
//       }
//     };

//     const fetchNotifications = async () => {
//       try {
//         const response = await axios.get(`/api/buddy-lens/notifications`, {
//           params: { userId: reviewerId },
//         });
//         setNotifications(response.data);
//       } catch (err) {
//         toast.error('Failed to fetch notifications');
//         console.log("Error:",err);
//       }
//     };

//     const fetchReviewedRequests = async () => {
//       try {
//         const response = await axios.get(`/api/buddy-lens/reviewer`, {
//           params: { reviewerId },
//         });
//         setReviewedRequests(response.data); // Store reviewed requests
//       } catch (err) {
//         toast.error('Failed to fetch reviewed requests');
//         console.log("Error:",err);
//       }
//     };

//     fetchRequests();
//     fetchNotifications();
//     fetchReviewedRequests(); // Fetch reviewed requests
//     const interval = setInterval(() => {
//       fetchRequests();
//       fetchNotifications();
//       fetchReviewedRequests(); // Fetch reviewed requests periodically
//     }, 10000);
//     return () => clearInterval(interval);
//   }, [reviewerId]);

//   // Check for requestId in URL params when page loads
//   useEffect(() => {
//     const searchParams = new URLSearchParams(window.location.search);
//     const requestId = searchParams.get('requestId');

//     if (requestId) {
//       const fetchRequestDetails = async () => {
//         try {
//           const response = await axios.get(`/api/buddy-lens/approve?requestId=${requestId}`);
//           if (response.data && response.data.status === 'CLAIMED' && response.data.reviewerId === reviewerId) {
//             setSelectedRequest(response.data);
//           }
//         } catch (err) {
//           toast.error('Failed to fetch request details');
//           console.log("Error:",err);
//         }
//       };

//       fetchRequestDetails();
//     }
//   }, [reviewerId]);

//   // Claim a requestn
//   const handleClaimRequest = async (requestId: string) => {
//     try {
//       if (!reviewerId) {
//         console.error('Cannot claim request: reviewerId is undefined or null');
//         toast.error('Unable to claim request: User ID not found');
//         return;
//       }

//       const response = await axios.patch('/api/buddy-lens/reviewer', {
//         requestId,
//         reviewerId
//       });

//       toast.success('Claim request submitted, awaiting approval');
//       setRequests(
//         requests.map((req) =>
//           req.id === requestId ? { ...req, status: 'PENDING', pendingReviewerId: reviewerId } : req
//         )
//       );
//     } catch (err) {
//       toast.error('Failed to claim request');
//       console.log("Error:",err);
//     }
//   };

//   // Submit a review
//   const handleSubmitReview = async () => {
//     if (!selectedRequest || !reviewText || !rating || answers.some((a) => !a.trim())) {
//       toast.error('Please fill in all fields');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await axios.post('/api/buddy-lens/reviewer', {
//         action: 'submit-review',
//         requestId: selectedRequest.id,
//         reviewerId,
//         answers,
//         reviewText,
//         rating,
//         feedback,
//         status: 'SUBMITTED',
//       });
//       toast.success(`Review submitted successfully! You earned ${selectedRequest.jpCost} JoyPearls.`);
//       setSelectedRequest(null);
//       setAnswers([]);
//       setReviewText('');
//       setRating(null);
//       setFeedback('');
//       setRequests(requests.filter((req) => req.id !== selectedRequest.id));
//     } catch (err) {
//       toast.error('Failed to submit review');
//       console.log("Error:",err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Initialize answers
//   useEffect(() => {
//     if (selectedRequest) {
//       setAnswers(selectedRequest.questions.map(() => ''));
//     }
//   }, [selectedRequest]);

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <h2 className="text-3xl font-semibold text-center">👀 Review Page</h2>

//         {!selectedRequest ? (
//           <div className="space-y-4">
//             <h3 className="text-xl font-medium">Open Requests</h3>
//             {requests.length === 0 && <p>No open requests available.</p>}
//             {requests.map((req) => (
//               <Card key={req.id} className="p-4">
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <p className="font-medium">{req.feedbackType}</p>
//                     <p className="text-sm text-gray-600">{req.domain}</p>
//                     <p className="text-sm text-gray-600">Tier: {req.tier}</p>
//                     <p className="text-sm text-gray-600">Reward: {req.jpCost} JoyPearls</p>
//                     <a
//                       href={req.socialMediaUrl}
//                       target="_blank"
//                       className="text-blue-600 flex items-center gap-1"
//                     >
//                       <LinkIcon className="w-4 h-4" /> View Content
//                     </a>
//                   </div>
//                   <Button
//                     onClick={() => handleClaimRequest(req.id)}
//                     disabled={req.status === 'PENDING' || req.status === 'CLAIMED'}
//                     className={
//                       req.status === 'PENDING' || req.status === 'CLAIMED'
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-blue-600 hover:bg-blue-700'
//                     }
//                   >
//                     {req.status === 'PENDING' && req.pendingReviewerId === reviewerId
//                       ? 'Pending Approval'
//                       : req.status === 'CLAIMED'
//                       ? 'Claimed'
//                       : 'Claim Request'}
//                   </Button>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <div className="space-y-6">
//             <h3 className="text-xl font-medium">Review: {selectedRequest.feedbackType}</h3>
//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <LinkIcon className="w-4 h-4" />
//                 Social Media URL
//               </label>
//               <a href={selectedRequest.socialMediaUrl} target="_blank" className="text-blue-600">
//                 {selectedRequest.socialMediaUrl}
//               </a>
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <FileQuestion className="w-4 h-4" />
//                 Answer Questions
//               </label>
//               {selectedRequest.questions.map((q: string, index: number) => (
//                 <div key={index} className="space-y-1">
//                   <p className="text-sm">{q}</p>
//                   <Textarea
//                     placeholder={`Answer ${index + 1}`}
//                     value={answers[index] || ''}
//                     onChange={(e) => {
//                       const updated = [...answers];
//                       updated[index] = e.target.value;
//                       setAnswers(updated);
//                     }}
//                   />
//                 </div>
//               ))}
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <Eye className="w-4 h-4" />
//                 Review Text
//               </label>
//               <Textarea
//                 placeholder="Write your review here"
//                 value={reviewText}
//                 onChange={(e) => setReviewText(e.target.value)}
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <Star className="w-4 h-4" />
//                 Rating (1-5)
//               </label>
//               <Input
//                 type="number"
//                 min={1}
//                 max={5}
//                 value={rating || ''}
//                 onChange={(e) => {
//                   const newRating = Number(e.target.value);
//                   if (newRating > 5) {
//                     setRatingError("Rating cannot be greater than 5!");
//                   } else if (newRating >= 1 && newRating <= 5) {
//                     setRating(newRating);
//                     setRatingError(''); // Clear the error message when the value is valid
//                   } else {
//                     setRatingError('Rating must be between 1 and 5.');
//                   }
//                 }}
//               />
//               {ratingError && <p className="text-red-500 text-sm">{ratingError}</p>} {/* Error message */}
//             </div>

//             <div className="space-y-2">
//               <label className="flex items-center gap-2 text-sm font-medium">
//                 <Send className="w-4 h-4" />
//                 Additional Feedback
//               </label>
//               <Textarea
//                 placeholder="Optional feedback"
//                 value={feedback}
//                 onChange={(e) => setFeedback(e.target.value)}
//               />
//             </div>

//             <Button
//               onClick={handleSubmitReview}
//               disabled={isSubmitting}
//               className="w-full bg-blue-600 hover:bg-blue-700 text-white"
//             >
//               {isSubmitting ? 'Submitting...' : 'Submit Review'}
//             </Button>
//           </div>
//         )}

//         {/* Conditionally render reviewed requests only if no request is selected */}
//         {!selectedRequest && (
//           <div className="space-y-4 mt-6">
//             <h3 className="text-xl font-medium">Reviewed Requests</h3>
//             {reviewedRequests.length === 0 ? (
//               <p>No reviewed requests available.</p>
//             ) : (
//               reviewedRequests.map((review: any) => (
//                 <Card key={review.id} className="p-4">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Request Domain:</span> {review.request.domain}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Feedback:</span> {review.feedback}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Rating:</span> {review.rating}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         <span className="font-medium text-black">Review Text:</span> {review.reviewText}
//                       </p>
//                     </div>
//                   </div>
//                 </Card>
//               ))
//             )}
//           </div>
//         )}
//       </Card>
//     </div>
//   );

// }
