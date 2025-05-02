'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuddyLensRequest } from '@/types/claim';
import { LinkIcon, Trash2 } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';

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

export default function BuddyLensDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'my-requests' | 'to-review' | 'reviewed'>('my-requests');

  // Fetch user's own requests
  const {
    data: myRequests = [],
    isLoading: isMyRequestsLoading,
    error: myRequestsError,
  } = useQuery({
    queryKey: ['myBuddyLensRequests', userId] as [string, string | undefined],
    queryFn: async () => {
      const response = await axios.get('/api/buddy-lens/requester');
      console.log('My Requests:', response.data);
      return response.data.filter((req: BuddyLensRequest) => !req.isDeleted);
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });

  // Fetch requests to review (other users' requests)
  const {
    data: reviewRequests = [],
    isLoading: isReviewRequestsLoading,
    error: reviewRequestsError,
  } = useQuery({
    queryKey: ['buddyLensRequestsToReview', userId] as [string, string | undefined],
    queryFn: async () => {
      const response = await axios.get('/api/buddy-lens/requester');
      console.log('Requests to review:', response.data);
      return response.data.filter(
        (req: BuddyLensRequest) =>
          req.requesterId !== userId &&
          ['OPEN', 'PENDING', 'CLAIMED'].includes(req.status) &&
          !req.isDeleted
      );
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });

  // Fetch reviewed requests
  const {
    data: reviewedRequests = [],
    isLoading: isReviewedRequestsLoading,
    error: reviewedRequestsError,
  } = useQuery({
    queryKey: ['buddyLensReviewedRequests', userId] as [string, string | undefined],
    queryFn: async () => {
      const response = await axios.get('/api/buddy-lens/reviewer');
      console.log('Reviewed Requests:', response.data);
      return response.data;
    },
    enabled: !!userId,
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
      queryClient.setQueryData(['buddyLensRequestsToReview', userId], (old: BuddyLensRequest[] | undefined) =>
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
      const request = reviewRequests.find((r: BuddyLensRequest) => r.id === requestId);
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
      queryClient.setQueryData(['buddyLensRequestsToReview', userId], (old: BuddyLensRequest[] | undefined) =>
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
    onError: (error: AxiosError<{ error: string }>, { action }) => {
      toast.error(error.response?.data?.error || `Failed to ${action.toLowerCase()} claim`);
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
      const response = await axios.delete(`/api/buddy-lens/requester/${requestId}`);
      return response.data;
    },
    onMutate: async (requestId: string) => {
      // Cancel ongoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['myBuddyLensRequests', userId] });

      // Snapshot the previous state
      const previousRequests = queryClient.getQueryData(['myBuddyLensRequests', userId]) as BuddyLensRequest[] | undefined;

      // Optimistically update the UI by removing the request
      queryClient.setQueryData(['myBuddyLensRequests', userId], (old: BuddyLensRequest[] | undefined) =>
        old?.filter((req) => req.id !== requestId)
      );

      // Return context for rollback
      return { previousRequests };
    },
    onSuccess: () => {
      toast.success('Request deleted successfully');
    },
    onError: (error: AxiosError<DeleteRequestError>, requestId, context) => {
      // Rollback to previous state on error
      queryClient.setQueryData(['myBuddyLensRequests', userId], context?.previousRequests);
      toast.error(error.response?.data?.error || 'Failed to delete request');
    },
    onSettled: () => {
      // Invalidate queries to ensure fresh data
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['myBuddyLensRequests', userId] });
      }
    },
  });

  if (!userId) {
    return <div className="text-center p-8">Please log in to use BuddyLens Dashboard.</div>;
  }

  if (myRequestsError || reviewRequestsError || reviewedRequestsError) {
    return (
      <div className="text-center p-8 text-red-600">
        Error: {myRequestsError?.message || reviewRequestsError?.message || reviewedRequestsError?.message}
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

        {/* Dropdown Menu */}
        <Select
          value={activeSection}
          onValueChange={(value: 'my-requests' | 'to-review' | 'reviewed') => setActiveSection(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my-requests">My Requests</SelectItem>
            <SelectItem value="to-review">Requests to Review</SelectItem>
            <SelectItem value="reviewed">Reviewed Requests</SelectItem>
          </SelectContent>
        </Select>

        {/* My Requests Section */}
        {activeSection === 'my-requests' && (
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
                    </div>
                    <div className="flex gap-2">
                      {req.status === 'CLAIMED' && (
                        <Button
                          onClick={() => deleteRequestMutation.mutate(req.id)}
                          disabled={deleteRequestMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {req.status === 'PENDING' && (
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
              ))
            )}
          </div>
        )}

        {/* Requests to Review Section */}
        {activeSection === 'to-review' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Requests to Review</h3>
            {isReviewRequestsLoading ? (
              <p>Loading...</p>
            ) : reviewRequests.length === 0 ? (
              <p>No requests available to review.</p>
            ) : (
              reviewRequests.map((req: BuddyLensRequest) => (
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
                    </div>
                    <div className="flex flex-col gap-2">
                      {req.status === 'OPEN' && (
                        <Button
                          onClick={() => claimRequestMutation.mutate(req.id)}
                          disabled={claimRequestMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Claim Request
                        </Button>
                      )}
                      {req.status === 'PENDING' && req.pendingReviewerId === userId && (
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
        )}

        {/* Reviewed Requests Section */}
        {activeSection === 'reviewed' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Reviewed Requests</h3>
            {isReviewedRequestsLoading ? (
              <p>Loading...</p>
            ) : reviewedRequests.length === 0 ? (
              <p>No reviewed requests.</p>
            ) : (
              reviewedRequests.map((review: Review) => {
                const request =
                  reviewRequests.find((r: BuddyLensRequest) => r.id === review.requestId) ||
                  myRequests.find((r: BuddyLensRequest) => r.id === review.requestId);
                return (
                  <Card key={review.id} className="p-4 space-y-2">
                    <div className="space-y-1">
                      <p className="font-medium">{review.request?.domain || 'Unknown Request'}</p>
                      <a
                        href={request?.socialMediaUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 flex items-center gap-1"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View Content
                      </a>
                      <div className="mt-3 p-3 bg-gray-100 rounded">
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
                          'No answers provided'
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
        )}
      </Card>
    </div>
  );
}