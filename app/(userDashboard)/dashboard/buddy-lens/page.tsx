'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BuddyLensRequest } from '@/types/claim';
import { LinkIcon } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';

interface Review {
  id: string;
  requestId: string;
  comments: string;
  rating: number;
  createdAt: string;
  reviewer: {
    name: string;
    email: string;
  };
}

export default function BuddyLensDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  // Fetch BuddyLens requests
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useQuery({
    queryKey: ['buddyLensRequests', userId],
    queryFn: async () => {
      const response = await axios.get('/api/buddy-lens/requester');
      return response.data.filter(
        (req: BuddyLensRequest) =>
          ['OPEN', 'PENDING', 'CLAIMED'].includes(req.status) && !req.isDeleted
      );
    },
    enabled: !!userId, // Only run if userId exists
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Fetch BuddyLens reviews
  const {
    data: reviews = [],
    isLoading: isReviewsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: ['buddyLensReviews', userId],
    queryFn: async () => {
      const response = await axios.get('/api/buddy-lens/reviewer');
      return response.data;
    },
    enabled: !!userId, // Only run if userId exists
  });

  // Mutation for claiming a request
  const claimRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await axios.patch('/api/buddy-lens/reviewer', {
        requestId,
        reviewerId: userId,
      });
    },
    onSuccess: (_, requestId) => {
      toast.success('Claim request sent for approval');
      queryClient.setQueryData(['buddyLensRequests', userId], (old: BuddyLensRequest[] | undefined) =>
        old?.map((req) =>
          req.id === requestId
            ? { ...req, status: 'PENDING', pendingReviewerId: userId }
            : req
        )
      );
    },
    onError: () => {
      toast.error('Failed to claim request');
    },
  });

  // Mutation for approving/rejecting a claim
  const claimActionMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: 'APPROVE' | 'REJECT';
    }) => {
      const request = requests.find((r: BuddyLensRequest) => r.id === requestId);
      if (!request?.pendingReviewerId) {
        throw new Error('No reviewer to approve/reject');
      }
      await axios.patch('/api/buddy-lens/approve', {
        requestId,
        reviewerId: request.pendingReviewerId,
        approve: action === 'APPROVE',
      });
    },
    onSuccess: (_, { requestId, action }) => {
      toast.success(`Claim ${action.toLowerCase()}d successfully`);
      queryClient.setQueryData(['buddyLensRequests', userId], (old: BuddyLensRequest[] | undefined) =>
        old?.map((req) =>
          req.id === requestId
            ? action === 'APPROVE'
              ? {
                  ...req,
                  status: 'CLAIMED',
                  reviewerId: req.pendingReviewerId,
                  pendingReviewerId: null,
                }
              : { ...req, status: 'OPEN', pendingReviewerId: null }
            : req
        )
      );
    },
    onError: (error, { action }) => {
      toast.error(error.message || `Failed to ${action.toLowerCase()} claim`);
    },
  });

  if (!userId) {
    return <div className="text-center p-8">Please log in to use BuddyLens Dashboard.</div>;
  }

  if (requestsError || reviewsError) {
    return (
      <div className="text-center p-8 text-red-600">
        Error: {requestsError?.message || reviewsError?.message}
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

        <div className="space-y-4">
          <h3 className="text-xl font-medium">Requests</h3>
          {isRequestsLoading || isReviewsLoading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p>No requests available.</p>
          ) : (
            requests.map((req: BuddyLensRequest) => {
              const review = reviews.find((r: Review) => r.requestId === req.id);

              return (
                <Card key={req.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-6">
                    <div className="space-y-1">
                      <p className="font-medium">{req.feedbackType}</p>
                      <p className="text-sm text-gray-600">
                        {req.platform} - {req.domain}
                      </p>
                      <p className="text-sm text-gray-600">Tier: {req.tier}</p>
                      <p className="text-sm text-gray-600">Reward: {req.jpCost} JoyPearls</p>
                      <p className="text-sm text-gray-600">Status: {req.status}</p>
                      <a
                        href={req.socialMediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 flex items-center gap-1"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View Content
                      </a>

                      {review && (
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <p className="text-sm font-medium">
                            Reviewed by: {review.reviewer?.name || 'Anonymous'}
                          </p>
                          <p className="text-sm">Rating: ⭐ {review.rating}/5</p>
                          <p className="text-sm">Comments: {review.comments}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {req.requesterId !== userId && req.status === 'OPEN' && (
                        <Button
                          onClick={() => claimRequestMutation.mutate(req.id)}
                          disabled={claimRequestMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Claim Request
                        </Button>
                      )}

                      {req.requesterId !== userId &&
                        req.status === 'PENDING' &&
                        req.pendingReviewerId === userId && (
                          <Button disabled className="bg-gray-400 cursor-not-allowed">
                            Pending Approval
                          </Button>
                        )}

                      {req.requesterId === userId && req.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() =>
                              claimActionMutation.mutate({
                                requestId: req.id,
                                action: 'APPROVE',
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
                                action: 'REJECT',
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
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { BuddyLensRequest } from '@/types/claim';
// import {  LinkIcon } from 'lucide-react';
// import { NotificationBell } from '@/components/notification-bell';

// interface Review {
//   id: string;
//   requestId: string;
//   comments: string;
//   rating: number;
//   createdAt: string;
//   reviewer: {
//     name: string;
//     email: string;
//   };
// }

// export default function BuddyLensDashboard() {
//   const [requests, setRequests] = useState<BuddyLensRequest[]>([]);
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const { data: session } = useSession();
//   const userId = session?.user?.id;

//   // Fetch BuddyLens requests
//   useEffect(() => {
//     if (!userId) return;

//     const fetchRequests = async () => {
//       try {
//         const response = await axios.get('/api/buddy-lens/requester');
//         const filtered = response.data.filter(
//           (req: BuddyLensRequest) =>
//             ['OPEN', 'PENDING', 'CLAIMED'].includes(req.status) && !req.isDeleted
//         );
//         setRequests(filtered);
//       } catch (err) {
//         console.log("Error occured:",err);
//         toast.error('Failed to fetch requests');
//       }
//     };

//     fetchRequests();
//     const interval = setInterval(fetchRequests, 10000);
//     return () => clearInterval(interval);
//   }, [userId]);

//   // Fetch BuddyLens reviews
//   useEffect(() => {
//     if (!userId) return;

//     const fetchReviews = async () => {
//       try {
//         const response = await axios.get('/api/buddy-lens/reviewer');
//         setReviews(response.data);
//       } catch (err) {
//         console.log("Error occured:",err);
//         toast.error('Failed to fetch reviews');
//       }
//     };

//     fetchReviews();
//   }, [userId]);

//   // Claim request (Reviewer)
//   const handleClaimRequest = async (requestId: string) => {
//     setIsLoading(true);
//     try {
//       await axios.patch('/api/buddy-lens/reviewer', {
//         requestId,
//         reviewerId: userId,
//       });
//       toast.success('Claim request sent for approval');
//       setRequests((prev) =>
//         prev.map((req) =>
//           req.id === requestId
//             ? { ...req, status: 'PENDING', pendingReviewerId: userId }
//             : req
//         )
//       );
//     } catch {
//       toast.error('Failed to claim request');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Approve or Reject a claim (Requester)
//   const handleClaimAction = async (
//     requestId: string,
//     action: 'APPROVE' | 'REJECT'
//   ) => {
//     setIsLoading(true);
//     try {
//       const request = requests.find((r) => r.id === requestId);
//       if (!request?.pendingReviewerId) {
//         toast.error('No reviewer to approve/reject');
//         return;
//       }

//       await axios.patch('/api/buddy-lens/approve', {
//         requestId,
//         reviewerId: request.pendingReviewerId,
//         approve: action === 'APPROVE',
//       });

//       toast.success(`Claim ${action.toLowerCase()}d successfully`);
//       setRequests((prev) =>
//         prev.map((req) =>
//           req.id === requestId
//             ? action === 'APPROVE'
//               ? {
//                   ...req,
//                   status: 'CLAIMED',
//                   reviewerId: request.pendingReviewerId,
//                   pendingReviewerId: null,
//                 }
//               : { ...req, status: 'OPEN', pendingReviewerId: null }
//             : req
//         )
//       );
//     } catch {
//       toast.error(`Failed to ${action.toLowerCase()} claim`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!userId) {
//     return <div className="text-center p-8">Please log in to use BuddyLens Dashboard.</div>;
//   }

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <div className="flex justify-between items-center">
//           <h2 className="text-3xl font-semibold">BuddyLens Dashboard</h2>
//           <NotificationBell />
//         </div>

//         <div className="space-y-4">
//           <h3 className="text-xl font-medium">Requests</h3>
//           {requests.length === 0 ? (
//             <p>No requests available.</p>
//           ) : (
//             requests.map((req) => {
//               const review = reviews.find((r) => r.requestId === req.id);

//               return (
//                 <Card key={req.id} className="p-4 space-y-2">
//                   <div className="flex justify-between items-start gap-6">
//                     <div className="space-y-1">
//                       <p className="font-medium">{req.feedbackType}</p>
//                       <p className="text-sm text-gray-600">
//                         {req.platform} - {req.domain}
//                       </p>
//                       <p className="text-sm text-gray-600">Tier: {req.tier}</p>
//                       <p className="text-sm text-gray-600">Reward: {req.jpCost} JoyPearls</p>
//                       <p className="text-sm text-gray-600">Status: {req.status}</p>
//                       <a
//                         href={req.socialMediaUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 flex items-center gap-1"
//                       >
//                         <LinkIcon className="w-4 h-4" />
//                         View Content
//                       </a>

//                       {review && (
//                         <div className="mt-3 p-3 bg-gray-100 rounded">
//                           <p className="text-sm font-medium">
//                             Reviewed by: {review.reviewer?.name || 'Anonymous'}
//                           </p>
//                           <p className="text-sm">Rating: ⭐ {review.rating}/5</p>
//                           <p className="text-sm">Comments: {review.comments}</p>
//                         </div>
//                       )}
//                     </div>

//                     <div className="flex flex-col gap-2">
//                       {req.requesterId !== userId && req.status === 'OPEN' && (
//                         <Button
//                           onClick={() => handleClaimRequest(req.id)}
//                           disabled={isLoading}
//                           className="bg-blue-600 hover:bg-blue-700"
//                         >
//                           Claim Request
//                         </Button>
//                       )}

//                       {req.requesterId !== userId &&
//                         req.status === 'PENDING' &&
//                         req.pendingReviewerId === userId && (
//                           <Button disabled className="bg-gray-400 cursor-not-allowed">
//                             Pending Approval
//                           </Button>
//                         )}

//                       {req.requesterId === userId && req.status === 'PENDING' && (
//                         <>
//                           <Button
//                             onClick={() => handleClaimAction(req.id, 'APPROVE')}
//                             disabled={isLoading}
//                             className="bg-green-600 hover:bg-green-700"
//                           >
//                             Approve
//                           </Button>
//                           <Button
//                             onClick={() => handleClaimAction(req.id, 'REJECT')}
//                             disabled={isLoading}
//                             className="bg-red-600 hover:bg-red-700"
//                           >
//                             Reject
//                           </Button>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 </Card>
//               );
//             })
//           )}
//         </div>
//       </Card>
//     </div>
//   );
// }


