"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PageLoader from "@/components/PageLoader";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const res = await axios.get(`/api/buddy-lens/reviewer/${id}`);
      console.log("data:",res.data);
      return res.data;
    
    },
    enabled: !!id,
  });

  if (isLoading) return <PageLoader/>
  if (error || !data) return <p>Review not found.</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">BuddyLens Review Details</h1>

      <div className="space-y-2 text-sm text-gray-700">
        <p><strong>Domain:</strong> {data.domain || 'N/A'}</p>
        <p><strong>Status:</strong> {data.status}</p>
        <p><strong>Rating:</strong> {data.review.rating} / 5</p>
        <p><strong>Feedback:</strong> {data.review.feedback}</p>
        <p><strong>Review Text:</strong> {data.review.reviewText}</p>
        <p>
          <strong>Submitted At:</strong>{" "}
          {data.review.submittedAt ? new Date(data.review.submittedAt).toLocaleString() : "N/A"}
        </p>
      </div>


      {data.review.answers?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Answers</h2>
          <ul className="list-disc pl-6 text-gray-700">
            {data.review.answers.map((answer: string, index: number) => (
              <li key={index}>{answer}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
