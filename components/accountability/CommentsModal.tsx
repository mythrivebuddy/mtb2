// components/accountability/CommentsModal.tsx
"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";


type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
  };
  replies?: Comment[];
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
  allMembers: MentionSuggestion[]
) => {
  const elements: React.ReactNode[] = [];
  let remainingText = content;

  while (remainingText.includes("@")) {
    const atIndex = remainingText.indexOf("@");
    const beforeText = remainingText.slice(0, atIndex);
    elements.push(beforeText);

    let matched = false;
    const sortedMembers = [...allMembers].sort(
      (a, b) => b.display.length - a.display.length
    );

    for (const member of sortedMembers) {
      const mentionText = `@${member.display}`;
      if (remainingText.substring(atIndex).startsWith(mentionText)) {
        elements.push(
          <Link
            key={`${member.id}-${atIndex}`}
            href={`/dashboard/accountability-hub/member/${member.id}?groupId=${groupId}`}
            className="text-blue-600 bg-blue-100 px-1 rounded-sm font-semibold"
            target="_blank"
          >
            {mentionText}
          </Link>
        );

        remainingText = remainingText.slice(atIndex + mentionText.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      elements.push("@");
      remainingText = remainingText.slice(atIndex + 1);
    }
  }

  elements.push(remainingText);
  return elements;
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

  const [newComment, setNewComment] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- ✅ Custom Mention State ---
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);

  // Map members once to the format we need
  const allMembersData: MentionSuggestion[] = members.map((member) => ({
    id: member.user.id,
    display: member.user.name || "User",
    image: member.user.image,
  }));
  // --- End Custom Mention State ---


  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: ["comments", goalId],
    queryFn: async () => {
      const res = await axios.get(`/api/accountability-hub/goals/${goalId}/comments`);
      return res.data;
    },
    enabled: !!goalId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return axios.post(`/api/accountability-hub/goals/${goalId}/comments`, {
        text: newComment,
        parentId: replyingTo,
      });
    },
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      setReplyingToName(null);
      queryClient.invalidateQueries({ queryKey: ["comments", goalId] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim() || isGroupBlocked) return;
    mutation.mutate();
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
                  target="_blank"
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

                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/accountability-hub/member/${comment.author.id}?groupId=${groupId}`}
                      className="font-semibold hover:underline"
                      target="_blank"
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
                    {renderCommentContent(comment.content, groupId, allMembersData)}
                  </p>

                  {/* ✅ REPLY BUTTON */}
                  <div className="flex items-center gap-4 mt-1">
                    <button
                      className="text-xs text-gray-500 hover:text-blue-600 font-semibold"
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setReplyingToName(comment.author.name || "User");

                        const cleanName = comment.author.name?.trim().replace(/\s+/g, " ");
                        const mention = `@${cleanName} `;

                        setNewComment((prev) => {
                          if (prev.startsWith(mention)) return prev;
                          return mention + prev;
                        });

                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                            textareaRef.current.setSelectionRange(mention.length, mention.length);
                          }
                        }, 0);
                      }}
                    >
                      Reply
                    </button>

                    <span className="text-xs text-gray-400">
                      {comment.replies?.length || 0} replies
                    </span>
                  </div>
                  {/* ✅ SHOW REPLIES */}
                  {comment.replies && comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3 mt-3 ml-10">
                      <Link
                        href={`/dashboard/accountability-hub/member/${reply.author.id}?groupId=${groupId}`}
                        target="_blank"
                      >
                        <Image
                          src={
                            reply.author.image
                              ? reply.author.image
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                reply.author.name?.charAt(0) || "User"
                              )}`
                          }
                          alt={reply.author.name || "User"}
                          width={26}
                          height={26}
                          className="rounded-full mt-1"
                        />
                      </Link>

                      <div className="bg-gray-100 px-3 py-2 rounded-2xl max-w-xs">
                        <p className="font-semibold text-xs">{reply.author.name}</p>

                        <p className="text-sm whitespace-pre-wrap">

                          {renderCommentContent(reply.content, groupId, allMembersData)}
                        </p>

                        <button
                          className="text-xs text-gray-500 hover:text-blue-600 font-semibold mt-1"
                          onClick={() => {
                            setReplyingTo(comment.id);
                            setReplyingToName(reply.author.name || "User");

                            const cleanName = reply.author.name?.trim().replace(/\s+/g, " ");
                            const mention = `@${cleanName} `;

                            setNewComment((prev) => {
                              if (prev.startsWith(mention)) return prev;
                              return mention + prev;
                            });

                            setTimeout(() => {
                              if (textareaRef.current) {
                                textareaRef.current.focus();
                                textareaRef.current.setSelectionRange(mention.length, mention.length);
                              }
                            }, 0);
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
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
                  className={`flex w-full items-center gap-2 relative cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${index === activeSuggestionIndex
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
          {replyingTo && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md mb-2">
              <p className="text-sm">
                Replying to <span className="font-semibold">{replyingToName}</span>
              </p>
              <button
                className="text-xs font-semibold"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyingToName(null);
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            placeholder={
              replyingTo
                ? `Write a reply to ${replyingToName}...`
                : "Write a comment... @ to mention a member."
            }
            value={newComment}
            disabled={mutation.isPending || isGroupBlocked}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={handleCommentChange}
            className="mb-2"
          />
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !newComment.trim() || isGroupBlocked}
            className="bg-green-600 hover:bg-green-700"
          >
            {mutation.isPending ? "Posting..." : "Post Comment"}
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
