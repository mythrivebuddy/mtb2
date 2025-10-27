// components/accountability/CommentsModal.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    image: string | null;
  };
};

interface CommentsModalProps {
  goalId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentsModal({ goalId, isOpen, onOpenChange }: CommentsModalProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const commentsUrl = goalId ? `/api/accountability-hub/goals/${goalId}/comments` : null;
  const { data: comments, error, isLoading } = useSWR<Comment[]>(commentsUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch(`/api/accountability-hub/goals/${goalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });
      if (!res.ok) throw new Error("Failed to post comment.");

      setNewComment("");
      mutate(commentsUrl); // Re-fetch comments to show the new one
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Goal Discussion</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-80 overflow-y-auto pr-4">
          {isLoading && <CommentSkeleton />}
          {error && <p className="text-red-500 text-center">Could not load comments.</p>}
          {!isLoading && comments?.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <Image src={comment.author.image || '/public-avatar.jpg'} alt={comment.author.name || 'User'} width={32} height={32} className="rounded-full mt-1"/>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{comment.author.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
          {!isLoading && comments?.length === 0 && <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to say something!</p>}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handleSubmit} disabled={isPosting || !newComment.trim()}>
            {isPosting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CommentSkeleton = () => (
  <div className="flex items-start gap-3">
    <Skeleton className="h-8 w-8 rounded-full"/>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  </div>
)