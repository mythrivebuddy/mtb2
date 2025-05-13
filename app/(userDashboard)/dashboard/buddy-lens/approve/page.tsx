"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CloudCog } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAxiosErrorMessage } from "@/utils/ax";
import { request } from "http";
import { Prisma } from "@prisma/client";

// interface BuddyLensRequest {
//   id: string;
//   name: string;
//   feedbackType: string;
//   platform: string;
//   domain: string;
//   tier: string;
//   jpCost: number;
//   socialMediaUrl: string;
//   status: string;
//   requesterId: string;
//   pendingReviewerId?: string;
//   reviewer?: { name: string; email: string };
// }

type BuddyLensRequest = Prisma.BuddyLensReviewGetPayload<{
  include: { reviewer: true; request: true };
}>;

export default function BuddyLensApprovePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get request ID and reviewer ID from search params
  const requestId = searchParams?.get("requestId");
  const reviewerId = searchParams?.get("reviewerId");

  // Log URL and navigation source for debugging
  useEffect(() => {
    console.log("Approval page loaded with URL:", window.location.href);
    console.log("Search params:", { requestId, reviewerId });
    console.log("Raw search params:", searchParams?.toString());
    console.log("Referrer:", document.referrer);
  }, [searchParams, requestId, reviewerId]);

  // Validate session
  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session || !session.user?.id) {
      console.error("No session or user ID found");
      toast.error("Please login to continue");
      router.push("/login");
    }
  }, [session, sessionStatus, router]);

  // Fetch request(s) data with React Query
  const {
    data: requests,
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useQuery<BuddyLensRequest[] | BuddyLensRequest | null>({
    queryKey: ["buddyLensRequests", requestId],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const url = requestId
        ? `/api/buddy-lens/approve?requestId=${requestId}`
        : `/api/buddy-lens/approve`;

      console.log(`Fetching: GET ${url}`);
      const response = await axios.get(url, {
        headers: { "Content-Type": "application/json" },
      });

      const requestData = response.data;
      console.log("Request data:", requestData);

      // Handle single request case
      if (requestId) {
        const singleRequestReview: BuddyLensRequest = requestData;

        if (singleRequestReview.request.requesterId !== session.user.id) {
          console.error(
            `Unauthorized: requesterId ${singleRequestReview.request.requesterId} does not match user ${session.user.id}`
          );
          toast.error("You are not authorized to approve this request");
          router.push("/dashboard/buddy-lens");
          return null;
        }

        if (singleRequestReview.status !== "PENDING") {
          console.error(
            `Invalid status: ${singleRequestReview.status}, expected PENDING`
          );
          toast.error("This claim is no longer pending review");
          router.push("/dashboard/buddy-lens");
          return null;
        }

        if (reviewerId && singleRequestReview.reviewerId !== reviewerId) {
          console.log(
            `Invalid reviewer: pendingReviewerId ${singleRequestReview.reviewerId}, expected ${reviewerId}`
          );
          toast.error("Invalid reviewer for this claim");
          router.push("/dashboard/buddy-lens");
          return null;
        }

        return singleRequestReview;
      }

      // Handle multiple requests case
      return requestData as BuddyLensRequest[];
    },
    enabled: !!session?.user?.id && sessionStatus === "authenticated",
    retry: false,
    retryDelay: 1000,
  });

  console.log("requests TO APPROVE---------------------------", requests);

  // Mutation for approve/reject actions
  const { mutateAsync: handleApproveReject, isPending: isApproveLoading } =
    useMutation({
      mutationFn: async ({
        requestId,
        reviewerId,
        approve,
      }: {
        requestId: string;
        reviewerId: string;
        approve: boolean;
      }) => {
        console.log("ids", requestId, "s", reviewerId, "s", approve);

        if (!session?.user?.id || !requestId || !reviewerId) {
          throw new Error("Missing required information");
        }

        console.log("Sending: PATCH /api/buddy-lens/approve", {
          requestId,
          reviewerId,
          approve,
        });
        const response = await axios.patch(
          `/api/buddy-lens/approve`,
          {
            requestId,
            reviewerId,
            approve,
            requesterId: session.user.id,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log("data:", response.data);

        return response.data;
      },
      onSuccess: (data, variables) => {
        toast.success(
          data.message ||
            (variables.approve
              ? "Claim approved successfully"
              : "Claim rejected successfully")
        );
        router.push("/dashboard/buddy-lens");
      },
      onError: (error) => {
        const errorMessage = getAxiosErrorMessage(
          error,
          "Error processing request"
        );
        toast.error(errorMessage);
      },
    });

  console.log("requests ---------------------  ", requests);

  // Mutation for cancel action
  // const { mutateAsync: handleCancel, isPending: isCancelLoading } = useMutation({
  //   mutationFn: async ({ requestId, reviewerId }: { requestId: string; reviewerId: string }) => {
  //     if (!session?.user?.id || !requestId || !reviewerId) {
  //       throw new Error('Missing required information');
  //     }

  //     console.log(`Sending: DELETE /api/buddy-lens/approve?requestId=${requestId}&reviewerId=${reviewerId}`);
  //     const response = await axios.delete(
  //       `/api/buddy-lens/approve?requestId=${requestId}&reviewerId=${reviewerId}`,
  //       {
  //         headers: { 'Content-Type': 'application/json' },
  //       }
  //     );
  //     return response.data;
  //   },
  //   onSuccess: (data) => {
  //     toast.success(data.message || 'Claim cancelled successfully');
  //     router.push('/dashboard/buddy-lens');
  //   },
  //   onError: (error) => {
  //     const errorMessage = getAxiosErrorMessage(error, 'Error cancelling request');
  //     toast.error(errorMessage);
  //   },
  // });

  // Show loading state
  if (sessionStatus === "loading" || isRequestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CloudCog className="animate-spin h-8 w-8 mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  // Show error state
  if (requestsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-center">
            Error Loading Requests
          </h2>
          <p className="mt-2 text-center text-gray-600">
            {getAxiosErrorMessage(requestsError, "Failed to load request data")}
          </p>
          <Button
            onClick={() => router.push("/dashboard/buddy-lens/requester")}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Show UI for requests
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-semibold text-center mb-6">
        Pending Reviewer Claims
      </h2>
      {Array.isArray(requests) && requests.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-gray-600">No pending claims to approve.</p>
          <Button
            onClick={() => router.push("/dashboard/buddy-lens")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Dashboard
          </Button>
        </Card>
      )}

      {Array.isArray(requests) && requests.length > 0 && (
        <div className="space-y-6">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="rounded-2xl shadow-lg p-6 space-y-4"
            >
              <p>
                <strong>Reviewer Name:</strong> {request?.reviewer?.name}
              </p>

              <p>
                <strong>Domain:</strong> {request.request.domain}
              </p>
              <p>
                <strong>Tier:</strong> {request.request.tier}
              </p>
              <p>
                <strong>Reward:</strong> {request.request.jpCost} JoyPearls
              </p>
            
              <p>
                <strong>Reviewer Profile:</strong>{" "}
                <a
                  href={`http://localhost:3000/profile/${request.reviewerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  Click here to view
                </a>
              </p>
              <p>
                <strong>Social Media URL:</strong>{" "}
                <a
                  href={request.request.socialMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  {request.request.socialMediaUrl}
                </a>
              </p>
              <div className="flex gap-11">
                <Button
                  onClick={() =>
                    handleApproveReject({
                      requestId: request.request.id,
                      reviewerId: request.reviewerId || "",
                      approve: true,
                    })
                  }
                  disabled={isApproveLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </Button>
                <Button
                  onClick={() =>
                    handleApproveReject({
                      requestId: request.request.id,
                      reviewerId: request.reviewerId || "",
                      approve: false,
                    })
                  }
                  disabled={isApproveLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject
                </Button>
                {/* <Button
                  onClick={() =>
                    handleCancel({
                      requestId: request.id,
                      reviewerId: request.pendingReviewerId || '',
                    })
                  }
                  disabled={isApproveLoading || isCancelLoading}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </Button> */}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!Array.isArray(requests) && requests && (
        <Card className="rounded-2xl shadow-lg p-6 space-y-6">
          <h2 className="text-3xl font-semibold text-center">
            Approve Reviewer Claim
          </h2>
          <div className="space-y-4">
             <p>
                <strong>Reviewer Name:</strong> {requests?.reviewer?.name}
              </p>
            <p>
              <strong>Domain:</strong> {requests.request.domain}
            </p>
            <p>
              <strong>Tier:</strong> {requests.request.tier}
            </p>
            <p>
              <strong>Reward:</strong> {requests.request.jpCost} JoyPearls
            </p>
            {/* <p>
              <strong>Reviewer:</strong> {reviewer.name }
            </p> */}
            <p>
              <strong>Reviewer Profile:</strong>{" "}
              <a
                href={`http://localhost:3000/profile/${requests.reviewerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                Click here to view
              </a>
            </p>
            <p>
              <strong>Social Media URL:</strong>{" "}
              <a
                href={requests.request.socialMediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                {requests.request.socialMediaUrl}
              </a>
            </p>
            <div className="flex gap-7">
              <Button
                onClick={() =>
                  handleApproveReject({
                    requestId: requests.request.id,
                    reviewerId: requests.reviewerId || reviewerId || "",
                    approve: true,
                  })
                }
                disabled={isApproveLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
              <Button
                onClick={() =>
                  handleApproveReject({
                    requestId: requests.request.id,
                    reviewerId: requests.reviewerId || reviewerId || "",
                    approve: false,
                  })
                }
                disabled={isApproveLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reject
              </Button>
              {/* <Button
                onClick={() =>
                  handleCancel({
                    requestId: requests.id,
                    reviewerId: requests.pendingReviewerId || reviewerId || '',
                  })
                }
                disabled={isApproveLoading || isCancelLoading}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button> */}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
// 'use client';

// import { useEffect } from 'react';
// import { useSession } from 'next-auth/react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { CloudCog } from 'lucide-react';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { getAxiosErrorMessage } from '@/utils/ax';

// interface BuddyLensRequest {
//   id: string;
//   feedbackType: string;
//   platform: string;
//   domain: string;
//   tier: string;
//   jpCost: number;
//   socialMediaUrl: string;
//   status: string;
//   requesterId: string;
//   pendingReviewerId?: string;
//   reviewer?: { name: string,email:string };
// }

// export default function BuddyLensApprovePage() {
//   const { data: session, status: sessionStatus } = useSession();
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // Get parameters from URL
//   const requestId = searchParams?.get('requestId');
//   const reviewerId = searchParams?.get('reviewerId');

//   // Log URL and navigation source for debugging
//   useEffect(() => {
//     console.log('Approval page loaded with URL:', window.location.href);
//     console.log('Search params:', { requestId, reviewerId });
//     console.log('Raw search params:', searchParams?.toString());
//     console.log('Referrer:', document.referrer);
//   }, [searchParams, requestId, reviewerId]);

//   // Validate URL parameters
//   useEffect(() => {
//     if (sessionStatus === 'loading') return;

//     if (!session || !session.user?.id) {
//       console.error('No session or user ID found');
//       toast.error('Please login to continue');
//       router.push('/login');
//       return;
//     }

//     if (!requestId || !reviewerId) {
//       console.error('Missing required parameters:', { requestId, reviewerId });
//       toast.error('Invalid approval link. Please use a valid link from your notifications.');
//       setTimeout(() => router.push('/dashboard/buddy-lens'), 2000);
//       return;
//     }
//   }, [requestId, reviewerId, session, sessionStatus, router]);

//   // Fetch request data with React Query
//   const {
//     data: request,
//     isLoading: isRequestLoading,
//     error: requestError,
//   } = useQuery<BuddyLensRequest | null>({
//     // queryKey: ['buddyLensRequest'], //!DEEPAK CHANG4S
//     queryKey: ['buddyLensRequest', requestId],
//     queryFn: async () => {
//       if (!requestId || !reviewerId || !session?.user?.id) return null;

//       console.log(`Fetching: GET /api/buddy-lens/approve?requestId=${requestId}`);
//       const response = await axios.get(`/api/buddy-lens/approve?requestId=${requestId}`, {
//         headers: { 'Content-Type': 'application/json' },
//       });
//       const requestData: BuddyLensRequest = response.data;
//       console.log('Request data:', requestData);

//       if (requestData.requesterId !== session.user.id) {
//         console.error(`Unauthorized: requesterId ${requestData.requesterId} does not match user ${session.user.id}`);
//         toast.error('You are not authorized to approve this request');
//         router.push('/dashboard/buddy-lens/requester');
//         return null;
//       }

//       if (requestData.status !== 'PENDING') {
//         console.error(`Invalid status: ${requestData.status}, expected PENDING`);
//         toast.error('This claim is no longer pending review');
//         router.push('/dashboard/buddy-lens/requester');
//         return null;
//       }

//       if (requestData.pendingReviewerId !== reviewerId) {
//         console.log(`Invalid reviewer: pendingReviewerId ${requestData.pendingReviewerId}, expected ${reviewerId}`);
//         toast.error('Invalid reviewer for this claim');
//         router.push('/dashboard/buddy-lens/requester');
//         return null;
//       }

//       return requestData;
//     },
//     enabled: !!requestId && !!reviewerId && !!session?.user?.id && sessionStatus === 'authenticated',
//     retry: false,
//     retryDelay: 1000,
//   });

//   // Mutation for approve/reject actions
//   const { mutateAsync: handleApproveReject, isPending: isApproveLoading } = useMutation({
//     mutationFn: async (approve: boolean) => {
//       if (!session?.user?.id || !requestId || !reviewerId) {
//         throw new Error('Missing required information');
//       }

//       console.log('Sending: PATCH /api/buddy-lens/approve', { requestId, reviewerId, approve });
//       const response = await axios.patch(
//         `/api/buddy-lens/approve`,
//         {
//           requestId,
//           reviewerId,
//           approve,
//           requesterId: session.user.id,
//         },
//         {
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );
//       return response.data;
//     },
//     onSuccess: (data, variables) => {
//       toast.success(data.message || (variables ? 'Claim approved successfully' : 'Claim rejected successfully'));
//       // queryClient.invalidateQueries({ queryKey: ['buddyLensRequest', requestId] });
//       router.push('/dashboard/buddy-lens');
//     },
//     onError: (error) => {
//       const errorMessage = getAxiosErrorMessage(error, "Error message");
//       toast.error(errorMessage);
//     },
//   });

//   // Mutation for cancel action
//   const { mutateAsync: handleCancel, isPending: isCancelLoading } = useMutation({
//     mutationFn: async () => {
//       if (!session?.user?.id || !requestId || !reviewerId) {
//         throw new Error('Missing required information');
//       }

//       console.log(`Sending: DELETE /api/buddy-lens/approve?requestId=${requestId}&reviewerId=${reviewerId}`);
//       const response = await axios.delete(
//         `/api/buddy-lens/approve?requestId=${requestId}&reviewerId=${reviewerId}`,
//         {
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );
//       return response.data;
//     },
//     onSuccess: (data) => {
//       toast.success(data.message || 'Claim cancelled successfully');
//       // queryClient.invalidateQueries({ queryKey: ['buddyLensRequest', requestId] });
//       router.push('/dashboard/buddy-lens');
//     },
//     onError: (error) => {
//       const errorMessage = getAxiosErrorMessage(error, "Error message");
//       toast.error(errorMessage);
//     },
//   });

//   // Show error UI if parameters are missing
//   if (!requestId || !reviewerId) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Card className="p-6">
//           <h2 className="text-2xl font-semibold text-center">Invalid Link</h2>
//           <p className="mt-2 text-center text-gray-600">
//             Please use a valid approval link from your notifications.
//           </p>
//           <Button
//             onClick={() => router.push('/dashboard/buddy-lens/requester')}
//             className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             Go to Dashboard
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   // Show loading state while fetching data
//   if (sessionStatus === 'loading' || isRequestLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <CloudCog className="animate-spin h-8 w-8 mr-2" />
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   // Show error state if request fetch failed
//   if (requestError) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Card className="p-6">
//           <h2 className="text-2xl font-semibold text-center">Error Loading Request</h2>
//           <p className="mt-2 text-center text-gray-600">
//             {getAxiosErrorMessage(requestError, "Failed to load request data")}
//           </p>
//           <Button
//             onClick={() => router.push('/dashboard/buddy-lens/requester')}
//             className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             Go to Dashboard
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   // Show UI when request is loaded
//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <h2 className="text-3xl font-semibold text-center">Approve Reviewer Claim</h2>
//         {request && (
//           <div className="space-y-4">
//             {/* <p>
//               <strong>Request:</strong> {request.feedbackType} on {request.platform}
//             </p> */}
//             <p>
//               <strong>Domain:</strong> {request.domain}
//             </p>
//             <p>
//               <strong>Tier:</strong> {request.tier}
//             </p>
//             <p>
//               <strong>Reward:</strong> {request.jpCost} JoyPearls
//             </p>
//             <p>
//               <strong>Reviewer:</strong> {request.reviewer?.name || request.pendingReviewerId}
//             </p>

//             {/* Reviewer Profile link */}
//             <p>
//               <strong>Reviewer profile: </strong>
//               <a href={`http://localhost:3000/dashboard/${reviewerId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
//               click here to view

//               </a>
//             </p>

//             <p>
//               <strong>Social Media URL:</strong>{' '}
//               <a href={request.socialMediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
//                 {request.socialMediaUrl}
//               </a>
//             </p>
//             <div className="flex gap-4">
//               <Button
//                 onClick={() => handleApproveReject(true)}
//                 disabled={isApproveLoading || isCancelLoading}
//                 className="bg-green-600 hover:bg-green-700 text-white"
//               >
//                 Approve
//               </Button>
//               <Button
//                 onClick={() => handleApproveReject(false)}
//                 disabled={isApproveLoading || isCancelLoading}
//                 className="bg-red-600 hover:bg-red-700 text-white"
//               >
//                 Reject
//               </Button>
//               <Button
//                 onClick={() => handleCancel()}
//                 disabled={isApproveLoading || isCancelLoading}
//                 className="bg-gray-600 hover:bg-gray-700 text-white"
//               >
//                 Cancel
//               </Button>
//             </div>
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
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { useSession } from 'next-auth/react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { CloudCog } from 'lucide-react';
// import { getAxiosErrorMessage } from '@/utils/ax';

// interface BuddyLensRequest {
//   id: string;
//   feedbackType: string;
//   platform: string;
//   domain: string;
//   tier: string;
//   jpCost: number;
//   socialMediaUrl: string;
//   status: string;
//   requesterId: string;
//   pendingReviewerId?: string;
//   reviewer?: { name: string };
// }

// export default function BuddyLensApprovePage() {
//   const [request, setRequest] = useState<BuddyLensRequest | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // Get parameters from URL
//   const requestId = searchParams?.get('requestId');
//   const reviewerId = searchParams?.get('reviewerId');

//   // Log URL and navigation source for debugging
//   useEffect(() => {
//     console.log('Approval page loaded with URL:', window.location.href);
//     console.log('Search params:', { requestId, reviewerId });
//     console.log('Raw search params:', searchParams?.toString());
//     console.log('Referrer:', document.referrer);
//   }, [searchParams,requestId,reviewerId ]);

//   // Validate URL parameters
//   useEffect(() => {
//     if (status === 'loading') return;

//     if (!session || !session.user?.id) {
//       console.error('No session or user ID found');
//       toast.error('Please login to continue');
//       router.push('/login');
//       return;
//     }

//     if (!requestId || !reviewerId) {
//       console.error('Missing required parameters:', { requestId, reviewerId });
//       toast.error('Invalid approval link. Please use a valid link from your notifications.');
//       setTimeout(() => router.push('/dashboard/buddy-lens'), 2000);
//       return;
//     }
//   }, [requestId, reviewerId, session, status, router]);

//   // Fetch request data
//   useEffect(() => {
//     if (status === 'loading' || !session || !requestId || !reviewerId) return;

//     const fetchRequest = async (reqId: string, revId: string, retries = 3, delay = 1000) => {
//       for (let i = 0; i < retries; i++) {
//         try {
//           console.log(`Fetching: GET /api/buddy-lens/approve?requestId=${reqId}`);
//           const response = await axios.get(`/api/buddy-lens/approve?requestId=${reqId}`, {
//             headers: { 'Content-Type': 'application/json' },
//           });
//           const requestData: BuddyLensRequest = response.data;
//           console.log('Request data:', requestData);

//           if (requestData.requesterId !== session.user.id) {
//             console.error(`Unauthorized: requesterId ${requestData.requesterId} does not match user ${session.user.id}`);
//             toast.error('You are not authorized to approve this request');
//             router.push('/dashboard/buddy-lens/requester');
//             return;
//           }

//           if (requestData.status !== 'PENDING') {
//             console.error(`Invalid status: ${requestData.status}, expected PENDING`);
//             toast.error('This claim is no longer pending review');
//             router.push('/dashboard/buddy-lens/requester');
//             return;
//           }

//           if (requestData.pendingReviewerId !== revId) {
//             console.error(`Invalid reviewer: pendingReviewerId ${requestData.pendingReviewerId}, expected ${revId}`);
//             toast.error('Invalid reviewer for this claim');
//             router.push('/dashboard/buddy-lens/requester');
//             return;
//           }

//           setRequest(requestData);
//           return;
//         } catch (err) {
//           const errorMessage = getAxiosErrorMessage(err,"Error message")
//           console.error(`Fetch attempt ${i + 1} failed:`, err);
//           if (i === retries - 1) {
//             toast.error(errorMessage);
//             router.push('/dashboard/buddy-lens/requester');
//           }
//           await new Promise((resolve) => setTimeout(resolve, delay));
//         }
//       }
//     };

//     fetchRequest(requestId, reviewerId);
//   }, [session, status, router, requestId, reviewerId]);

//   const handleApprove = async (approve: boolean) => {
//     if (!session?.user?.id || !requestId || !reviewerId) {
//       toast.error('Missing required information');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       console.log('Sending: PATCH /api/buddy-lens/approve', { requestId, reviewerId, approve });
//       const response = await axios.patch(
//         '/api/buddy-lens/approve',
//         {
//           requestId,
//           reviewerId,
//           approve,
//           requesterId: session.user.id,
//         },
//         {
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );

//       toast.success(response.data.message || (approve ? 'Claim approved successfully' : 'Claim rejected successfully'));
//       router.push('/dashboard/buddy-lens');
//     } catch (err) {
//       const errorMessage = getAxiosErrorMessage(err,"Error message")
//       toast.error(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = async () => {
//     if (!session?.user?.id || !requestId || !reviewerId) {
//       toast.error('Missing required information');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       console.log(`Sending: DELETE /api/buddy-lens/approve?requestId=${requestId}&reviewerId=${reviewerId}`);
//       const response = await axios.delete(
//         `/api/buddy-lens/approve?requestId=${requestId}&reviewerId=${reviewerId}`,
//         {
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );

//       toast.success(response.data.message || 'Claim cancelled successfully');
//       router.push('/dashboard/buddy-lens/requester');
//     } catch (err) {
//       const errorMessage = getAxiosErrorMessage(err,"Error message")

//       toast.error(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Show error UI if parameters are missing
//   if (!requestId || !reviewerId) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Card className="p-6">
//           <h2 className="text-2xl font-semibold text-center">Invalid Link</h2>
//           <p className="mt-2 text-center text-gray-600">
//             Please use a valid approval link from your notifications.
//           </p>
//           <Button
//             onClick={() => router.push('/dashboard/buddy-lens/requester')}
//             className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             Go to Dashboard
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   // Show loading state while fetching data
//   if (status === 'loading' || !request) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <CloudCog className="animate-spin h-8 w-8 mr-2" />
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <h2 className="text-3xl font-semibold text-center">Approve Reviewer Claim</h2>
//         <div className="space-y-4">
//           <p>
//             <strong>Request:</strong> {request.feedbackType} on {request.platform}
//           </p>
//           <p>
//             <strong>Domain:</strong> {request.domain}
//           </p>
//           <p>
//             <strong>Tier:</strong> {request.tier}
//           </p>
//           <p>
//             <strong>Reward:</strong> {request.jpCost} JoyPearls
//           </p>
//           <p>
//             <strong>Reviewer:</strong> {request.reviewer?.name || request.pendingReviewerId}
//           </p>
//           <p>
//             <strong>Social Media URL:</strong>{' '}
//             <a href={request.socialMediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
//               {request.socialMediaUrl}
//             </a>
//           </p>
//           <div className="flex gap-4">
//             <Button
//               onClick={() => handleApprove(true)}
//               disabled={isLoading}
//               className="bg-green-600 hover:bg-green-700 text-white"
//             >
//               Approve
//             </Button>
//             <Button
//               onClick={() => handleApprove(false)}
//               disabled={isLoading}
//               className="bg-red-600 hover:bg-red-700 text-white"
//             >
//               Reject
//             </Button>
//             <Button
//               onClick={handleCancel}
//               disabled={isLoading}
//               className="bg-gray-600 hover:bg-gray-700 text-white"
//             >
//               Cancel
//             </Button>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }
