'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import {
  Eye,
  Send,
  Star,
  LinkIcon,
  FileQuestion,
} from 'lucide-react';

export default function BuddyLensReviewPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reviewedRequests, setReviewedRequests] = useState<any[]>([]); // New state to store reviewed requests
  const { data: session } = useSession();
  const [ratingError, setRatingError] = useState<string>(''); // Error state to store error message


  const reviewerId = session?.user?.id;

  if (!reviewerId) {
    toast.error('User not logged in');
    return <div>Please log in to view requests.</div>;
  }

  // Fetch requests and notifications
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('/api/buddy-lens/requester');
        const filteredRequests = response.data.filter(
          (req: any) =>
            (req.status === 'OPEN' || req.status === 'PENDING' || req.status === 'CLAIMED') &&
            !req.isDeleted &&
            req.requesterId !== reviewerId
        );
        setRequests(filteredRequests);
      } catch (err) {
        toast.error('Failed to fetch requests');
        console.log("Error:",err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`/api/buddy-lens/notifications`, {
          params: { userId: reviewerId },
        });
        setNotifications(response.data);
      } catch (err) {
        toast.error('Failed to fetch notifications');
        console.log("Error:",err);
      }
    };

    const fetchReviewedRequests = async () => {
      try {
        const response = await axios.get(`/api/buddy-lens/reviewer`, {
          params: { reviewerId },
        });
        setReviewedRequests(response.data); // Store reviewed requests
      } catch (err) {
        toast.error('Failed to fetch reviewed requests');
        console.log("Error:",err);
      }
    };

    fetchRequests();
    fetchNotifications();
    fetchReviewedRequests(); // Fetch reviewed requests
    const interval = setInterval(() => {
      fetchRequests();
      fetchNotifications();
      fetchReviewedRequests(); // Fetch reviewed requests periodically
    }, 10000);
    return () => clearInterval(interval);
  }, [reviewerId]);

  // Check for requestId in URL params when page loads
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestId = searchParams.get('requestId');
    
    if (requestId) {
      const fetchRequestDetails = async () => {
        try {
          const response = await axios.get(`/api/buddy-lens/approve?requestId=${requestId}`);
          if (response.data && response.data.status === 'CLAIMED' && response.data.reviewerId === reviewerId) {
            setSelectedRequest(response.data);
          }
        } catch (err) {
          toast.error('Failed to fetch request details');
          console.log("Error:",err);
        }
      };
      
      fetchRequestDetails();
    }
  }, [reviewerId]);

  // Claim a requestn
  const handleClaimRequest = async (requestId: string) => {
    try {
      if (!reviewerId) {
        console.error('Cannot claim request: reviewerId is undefined or null');
        toast.error('Unable to claim request: User ID not found');
        return;
      }

      const response = await axios.patch('/api/buddy-lens/reviewer', { 
        requestId, 
        reviewerId 
      });
      
      toast.success('Claim request submitted, awaiting approval');
      setRequests(
        requests.map((req) =>
          req.id === requestId ? { ...req, status: 'PENDING', pendingReviewerId: reviewerId } : req
        )
      );
    } catch (err) {
      toast.error('Failed to claim request');
      console.log("Error:",err);
    }
  };

  // Submit a review
  const handleSubmitReview = async () => {
    if (!selectedRequest || !reviewText || !rating || answers.some((a) => !a.trim())) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/buddy-lens/reviewer', {
        action: 'submit-review',
        requestId: selectedRequest.id,
        reviewerId,
        answers,
        reviewText,
        rating,
        feedback,
        status: 'SUBMITTED',
      });
      toast.success(`Review submitted successfully! You earned ${selectedRequest.jpCost} JoyPearls.`);
      setSelectedRequest(null);
      setAnswers([]);
      setReviewText('');
      setRating(null);
      setFeedback('');
      setRequests(requests.filter((req) => req.id !== selectedRequest.id));
    } catch (err) {
      toast.error('Failed to submit review');
      console.log("Error:",err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize answers
  useEffect(() => {
    if (selectedRequest) {
      setAnswers(selectedRequest.questions.map(() => ''));
    }
  }, [selectedRequest]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg p-6 space-y-6">
        <h2 className="text-3xl font-semibold text-center">👀 Review Page</h2>
  
        {!selectedRequest ? (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Open Requests</h3>
            {requests.length === 0 && <p>No open requests available.</p>}
            {requests.map((req) => (
              <Card key={req.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{req.feedbackType}</p>
                    <p className="text-sm text-gray-600">{req.domain}</p>
                    <p className="text-sm text-gray-600">Tier: {req.tier}</p>
                    <p className="text-sm text-gray-600">Reward: {req.jpCost} JoyPearls</p>
                    <a
                      href={req.socialMediaUrl}
                      target="_blank"
                      className="text-blue-600 flex items-center gap-1"
                    >
                      <LinkIcon className="w-4 h-4" /> View Content
                    </a>
                  </div>
                  <Button
                    onClick={() => handleClaimRequest(req.id)}
                    disabled={req.status === 'PENDING' || req.status === 'CLAIMED'}
                    className={
                      req.status === 'PENDING' || req.status === 'CLAIMED'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }
                  >
                    {req.status === 'PENDING' && req.pendingReviewerId === reviewerId
                      ? 'Pending Approval'
                      : req.status === 'CLAIMED'
                      ? 'Claimed'
                      : 'Claim Request'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-medium">Review: {selectedRequest.feedbackType}</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="w-4 h-4" />
                Social Media URL
              </label>
              <a href={selectedRequest.socialMediaUrl} target="_blank" className="text-blue-600">
                {selectedRequest.socialMediaUrl}
              </a>
            </div>
  
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <FileQuestion className="w-4 h-4" />
                Answer Questions
              </label>
              {selectedRequest.questions.map((q: string, index: number) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm">{q}</p>
                  <Textarea
                    placeholder={`Answer ${index + 1}`}
                    value={answers[index] || ''}
                    onChange={(e) => {
                      const updated = [...answers];
                      updated[index] = e.target.value;
                      setAnswers(updated);
                    }}
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
                value={rating || ''}
                onChange={(e) => {
                  const newRating = Number(e.target.value);
                  if (newRating > 5) {
                    setRatingError("Rating cannot be greater than 5!");
                  } else if (newRating >= 1 && newRating <= 5) {
                    setRating(newRating);
                    setRatingError(''); // Clear the error message when the value is valid
                  } else {
                    setRatingError('Rating must be between 1 and 5.');
                  }
                }}
              />
              {ratingError && <p className="text-red-500 text-sm">{ratingError}</p>} {/* Error message */}
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
              />
            </div>
  
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        )}
  
        {/* Conditionally render reviewed requests only if no request is selected */}
        {!selectedRequest && (
          <div className="space-y-4 mt-6">
            <h3 className="text-xl font-medium">Reviewed Requests</h3>
            {reviewedRequests.length === 0 ? (
              <p>No reviewed requests available.</p>
            ) : (
              reviewedRequests.map((review: any) => (
                <Card key={review.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">Request Domain:</span> {review.request.domain}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">Feedback:</span> {review.feedback}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">Rating:</span> {review.rating}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-black">Review Text:</span> {review.reviewText}
                      </p>
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
//   Globe,
//   Clock,
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
//   const { data: session } = useSession();

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
//       }
//     };

//     fetchRequests();
//     fetchNotifications();
//     const interval = setInterval(() => {
//       fetchRequests();
//       fetchNotifications();
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
//         }
//       };
      
//       fetchRequestDetails();
//     }
//   }, [reviewerId]);

//   // Check for approved claims in notifications
//   useEffect(() => {
//     const approvedNotification = notifications.find(
//       (n: any) => n.message.includes('has been approved') && !n.read
//     );
//     if (approvedNotification && approvedNotification.link) {
//       const url = new URL(approvedNotification.link, window.location.origin);
//       const requestId = url.searchParams.get('requestId');
//       if (requestId) {
//         const request = requests.find(
//           (req) => req.id === requestId && req.status === 'CLAIMED' && req.reviewerId === reviewerId
//         );
//         if (request) {
//           setSelectedRequest(request);
//           axios.patch('/api/buddy-lens/notifications', { 
//             notificationId: approvedNotification.id 
//           });
//         } else {
//           // If request is not in the current list, fetch it specifically
//           const fetchApprovedRequest = async () => {
//             try {
//               const response = await axios.get(`/api/buddy-lens/approve?requestId=${requestId}`);
//               if (response.data && response.data.status === 'CLAIMED' && response.data.reviewerId === reviewerId) {
//                 setSelectedRequest(response.data);
//                 axios.patch('/api/buddy-lens/notifications', { 
//                   notificationId: approvedNotification.id 
//                 });
//               }
//             } catch (err) {
//               console.error('Failed to fetch approved request:', err);
//             }
//           };
          
//           fetchApprovedRequest();
//         }
//       }
//     }
//   }, [notifications, requests, reviewerId]);

//   // Claim a requestn
//   const handleClaimRequest = async (requestId: string) => {
//     try {
//       if (!reviewerId) {
//         console.error('Cannot claim request: reviewerId is undefined or null');
//         toast.error('Unable to claim request: User ID not found');
//         return;
//       }

//       console.log('Claiming request:', { requestId, reviewerId });
//       const response = await axios.patch('/api/buddy-lens/reviewer', { 
//         requestId, 
//         reviewerId 
//       });
      
//       console.log('Claim response:', response.data);
//       toast.success('Claim request submitted, awaiting approval');
//       setRequests(
//         requests.map((req) =>
//           req.id === requestId ? { ...req, status: 'PENDING', pendingReviewerId: reviewerId } : req
//         )
//       );
//     } catch (err) {
//       console.error('Error claiming request:', err);
//       toast.error('Failed to claim request');
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
//                 onChange={(e) => setRating(Number(e.target.value))}
//               />
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
//       </Card>
//     </div>
//   );
// }