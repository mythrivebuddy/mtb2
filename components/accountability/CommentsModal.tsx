// components/accountability/CommentsModal.tsx
"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
  };
};

type Member = {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type MentionSuggestion = {
  id: string;
  display: string;
  image: string | null;
};

interface CommentsModalProps {
  goalId: string | null;
  members: Member[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null; // ✅ Accept groupId
  isGroupBlocked: boolean;
}

// ✅ --- NEW renderCommentContent Function ---
// This function now finds mentions by name and searches the member list
const renderCommentContent = (
  content: string,
  groupId: string | null,
  allMembers: MentionSuggestion[] // ✅ Requires the full member list
) => {
  // Regex to find all @mentions (e.g., @Toheed, @ex1)
  const mentionRegex = /@(\w+)\b/g;

  // Split the content by the regex
  const parts = content.split(mentionRegex);

  return parts.map((part, index) => {
    // Even parts are regular text (before, between, or after mentions)
    if (index % 2 === 0) {
      return part;
    }

    // Odd parts are the "DisplayName" (e.g., "Toheed")
    const displayName = part;
    // Find the member in the list
    const member = allMembers.find((m) => m.display === displayName);

    // If we found a member and have a groupId, make a link
    if (member && groupId) {
      return (
        <Link
          href={`/dashboard/accountability-hub/member/${member.id}?groupId=${groupId}`}
          key={`${member.id}-${index}`}
          className="text-blue-600 bg-blue-100 px-1 rounded-sm font-semibold hover:bg-blue-200 transition-colors"
        >
          @{displayName}
        </Link>
      );
    }

    // If no match or no groupId, just render the plain text mention
    return `@${displayName}`;
  });
};

export default function CommentsModal({
  goalId,
  isOpen,
  onOpenChange,
  isGroupBlocked,
  members,
  groupId, // ✅ Destructure groupId
}: CommentsModalProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- ✅ Custom Mention State ---
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Map members once to the format we need
  const allMembersData: MentionSuggestion[] = members.map((member) => ({
    id: member.user.id,
    display: member.user.name || "User",
    image: member.user.image,
  }));
  // --- End Custom Mention State ---

  const commentsUrl = goalId
    ? `/api/accountability-hub/goals/${goalId}/comments`
    : null;
  const {
    data: comments,
    error,
    isLoading,
  } = useSWR<Comment[]>(commentsUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const handleSubmit = async () => {
    if (!newComment.trim() || isGroupBlocked) return;

    // --- ❌ NO PROCESSING ---
    // We send the raw text (e.g., "Hello @Toheed") directly to the API
    // as you requested.

    setIsPosting(true);
    try {
      const res = await fetch(
        `/api/accountability-hub/goals/${goalId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newComment }), // ✅ Send raw `newComment`
        }
      );
      if (!res.ok) throw new Error("Failed to post comment.");

      setNewComment("");
      mutate(commentsUrl);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  // --- ✅ Custom Mention Logic ---

  const handleSuggestionClick = (suggestion: MentionSuggestion) => {
    if (mentionStartIndex === -1 || isGroupBlocked) return;

    const mentionText = `@${suggestion.display} `;
    const part1 = newComment.substring(0, mentionStartIndex);
    const part2 = newComment.substring(
      mentionStartIndex + mentionQuery.length + 1 // +1 for the '@'
    );

    const newText = part1 + mentionText + part2;
    setNewComment(newText);

    setShowSuggestions(false);
    setMentionQuery("");
    setMentionStartIndex(-1);
    setActiveSuggestionIndex(0);

    setTimeout(() => {
      const newCursorPos = part1.length + mentionText.length;
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setNewComment(text);

    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const textAfterAt = textBeforeCursor.substring(atIndex);
    if (/^@\[[^\]]+\]\([^)]+\)$/.test(textAfterAt)) {
      setShowSuggestions(false);
      return;
    }

    const query = textBeforeCursor.substring(atIndex + 1);
    if (/\s/.test(query) || /@/.test(query)) {
      setShowSuggestions(false);
      return;
    }

    setMentionQuery(query);
    setMentionStartIndex(atIndex);

    const filteredSuggestions = allMembersData.filter((member) =>
      member.display.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
    setActiveSuggestionIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };
  // --- End Custom Mention Logic ---

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Goal Discussion</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-80 overflow-y-auto pr-4">
          {isLoading && <CommentSkeleton />}
          {error && (
            <p className="text-red-500 text-center">Could not load comments.</p>
          )}
          {!isLoading &&
            comments?.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Link
                  href={`/dashboard/accountability-hub/member/${comment.author.id}?groupId=${groupId}`}
                >
                  <Image
                    src={
                      comment.author.image
                        ? comment.author.image
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            comment.author.name?.charAt(0) || "User"
                          )}&background=random&color=fff`
                    }
                    alt={comment.author.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full mt-1"
                  />
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/accountability-hub/member/${comment.author.id}?groupId=${groupId}`}
                      className="font-semibold hover:underline"
                    >
                      {comment.author.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {renderCommentContent(
                      comment.content,
                      groupId,
                      allMembersData
                    )}
                  </p>
                </div>
              </div>
            ))}
          {!isLoading && comments?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to say something!
            </p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t relative">
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 z-50 max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none p-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  className={`flex w-full items-center gap-2 relative cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${
                    index === activeSuggestionIndex
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={suggestion.image || undefined} />
                    <AvatarFallback>
                      {suggestion.display.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{suggestion.display}</span>
                </button>
              ))}
            </div>
          )}

          <Textarea
            ref={textareaRef}
            placeholder="Write a comment... @ to mention a member."
            value={newComment}
            disabled={isGroupBlocked}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={handleCommentChange}
            className="mb-2"
          />
          <Button
            onClick={handleSubmit}
            disabled={isPosting || !newComment.trim() || isGroupBlocked}
          >
            {isPosting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CommentSkeleton = () => (
  <div className="flex items-start gap-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  </div>
);
