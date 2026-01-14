"use client";

import { useEffect, useRef, useState, ChangeEvent, KeyboardEvent } from "react";
import axios from "axios";
import { supabaseClient } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import {
  Send,
  ArrowDown,
  SmilePlus,
  Reply,
  X,
  BarChartHorizontal,
} from "lucide-react";
import { RealtimeChannel } from "@supabase/supabase-js";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";
import { PopoverClose } from "@radix-ui/react-popover";
import { LeaderboardPlayer } from "@/app/(userDashboard)/dashboard/challenge/my-challenges/[slug]/page";

// ✅ Import Poll Components
import { PollCreationModal } from "./PollCreationModal";
import { PollBubble } from "./PollBubble";
import { toast } from "sonner";

// --- Types ---
type Reaction = {
  emoji: string;
  userId: string;
  user: { name: string | null; image: string | null };
};

// ✅ New Poll Types
type PollVote = {
  userId: string;
  user: { name: string | null; image: string | null };
};
type PollOption = { id: string; text: string; votes: PollVote[] };
type PollData = {
  id: string;
  question: string;
  allowMultiple: boolean;
  options: PollOption[];
};

type Msg = {
  id: string;
  message: string | null;
  createdAt: string;
  userId: string | null;
  challengeId: string;
  type?: "USER" | "SYSTEM";
  meta?: {
    action?: "JOIN" | "LEAVE";
    joinedUserId?: string;
    joinedUserName?: string;
  };
  user?: { id: string; name: string; image: string | null };
  reactions?: Reaction[];
  poll?: PollData;
  replyTo?: {
    id: string;
    message: string;
    user: { name: string | null };
  } | null;
  __optimistic?: boolean;
};

type MentionSuggestion = {
  id: string;
  display: string;
  image: string | null;
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

// --- Helpers ---
const getInitials = (name: string | null | undefined) => {
  if (!name) return "M";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// --- Mention rendering function ---
const renderMentions = (
  content: string,
  allMembers: MentionSuggestion[],
  isMe: boolean
) => {
  const mentionRegex = /@(\w+)\b/g;
  const parts = content.split(mentionRegex);

  return parts.map((part, index) => {
    if (index % 2 === 0) return part;
    const displayName = part;
    const member = allMembers.find((m) => m.display === displayName);

    if (member) {
      return (
        <Link
          key={`${member.id}-${index}`}
          href={`/profile/${member.id}`}
          className={`${isMe ? "text-blue-300" : "text-blue-500"} font-semibold`}
        >
          @{displayName}
        </Link>
      );
    }
    return `@${displayName}`;
  });
};

// --- Text Parser ---
function renderMessageText(
  text: string | null,
  isMe: boolean,
  allMembers: MentionSuggestion[]
) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Link
              key={`url-${index}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isMe ? "text-blue-200" : "text-blue-600"} underline break-all hover:opacity-80`}
            >
              {part}
            </Link>
          );
        }
        return (
          <span key={`text-${index}`}>
            {renderMentions(part, allMembers, isMe)}
          </span>
        );
      })}
    </span>
  );
}

export default function ChallengeChat({
  challengeId,
  isChatDisabled,
  members = [],
}: {
  challengeId: string;
  isChatDisabled: boolean;
  members?: LeaderboardPlayer[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  const [isPollModalOpen, setIsPollModalOpen] = useState(false);

  const session = useSession();
  const currentUserId = session.data?.user.id;
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isTypingSentRef = useRef(false);
  const typingSentResetRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);

  // --- Mention state ---
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Map members to mention format
  const allMembersData: MentionSuggestion[] = members.map((m) => {
    const mm = m as LeaderboardPlayer & {
      user?: { id?: string; name?: string; image?: string };
      userId?: string;
      id?: string;
      name?: string;
      image?: string;
    };

    const resolvedId =
      typeof mm.id === "string" && mm.id.length > 0
        ? mm.id
        : typeof mm.userId === "string" && mm.userId.length > 0
          ? mm.userId
          : (mm.user?.id ?? "");

    const display = mm.name ?? mm.user?.name ?? "User";
    const image = mm.image ?? mm.user?.image ?? null;

    return { id: resolvedId, display, image };
  });

  // --- Scrolling logic ---
  const scrollBottom = () => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isAtBottom = () => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (!viewport) return false;

    return (
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 50
    );
  };

  //   const handleScroll = () => {
  //   if (isAtBottom()) {
  //     setShowScrollArrow(false);
  //     setHasNewMessages(false);
  //   } else {
  //     setShowScrollArrow(true);
  //   }
  // };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  // --- API Calls ---
  const loadMessages = async () => {
    try {
      const res = await axios.get(`/api/challenge/chat/${challengeId}`);
      setMessages(res.data);
      setTimeout(() => {
        if (!isAtBottom()) setShowScrollArrow(true);
      }, 100);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingReactions = msg.reactions || [];
        const myExistingIndex = existingReactions.findIndex(
          (r) => r.userId === currentUserId
        );

        const newReactions = [...existingReactions];

        if (myExistingIndex !== -1) {
          const currentEmoji = existingReactions[myExistingIndex].emoji;
          if (currentEmoji === emoji) {
            newReactions.splice(myExistingIndex, 1);
          } else {
            newReactions[myExistingIndex] = {
              ...newReactions[myExistingIndex],
              emoji,
            };
          }
        } else {
          newReactions.push({
            emoji,
            userId: currentUserId,
            user: {
              name: session.data?.user?.name ?? "You",
              image: session.data?.user?.image ?? null,
            },
          });
        }
        return { ...msg, reactions: newReactions };
      })
    );

    try {
      await axios.post("/api/challenge/chat/react", {
        challengeId,
        messageId,
        emoji,
      });
    } catch (error) {
      console.error("Reaction failed", error);
    }
  };

  // ✅ FIXED: POLL HANDLER (Now updates state immediately)
  const handleCreatePoll = async (
    question: string,
    options: string[],
    allowMultiple: boolean
  ) => {
    try {
      const res = await axios.post("/api/challenge/chat/poll/create", {
        challengeId,
        question,
        options,
        allowMultiple,
      });

      // ✅ FIX: Manually add the new poll to state (since no optimistic UI)
      const newPollMsg = res.data;
      setMessages((prev) => [...prev, newPollMsg]);
      toast.success("Poll created successfully!");
      setTimeout(() => scrollBottom(), 100);
    } catch (error) {
      console.error("Poll creation failed", error);
      toast.error("Failed to create poll!");
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUserId) return;

    // Optimistic Update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.poll?.id !== pollId) return msg;

        const poll = msg.poll;
        const myId = currentUserId;

        const newOptions = poll.options.map((opt) => {
          const hasVoted = opt.votes.some((v) => v.userId === myId);

          if (opt.id === optionId) {
            if (hasVoted) {
              return {
                ...opt,
                votes: opt.votes.filter((v) => v.userId !== myId),
              };
            } else {
              return {
                ...opt,
                votes: [
                  ...opt.votes,
                  {
                    userId: myId,
                    user: {
                      name: session.data?.user?.name ?? "You",
                      image: session.data?.user?.image ?? null,
                    },
                  },
                ],
              };
            }
          }

          if (!poll.allowMultiple && hasVoted) {
            return {
              ...opt,
              votes: opt.votes.filter((v) => v.userId !== myId),
            };
          }

          return opt;
        });

        return { ...msg, poll: { ...poll, options: newOptions } };
      })
    );

    // API Call
    try {
      await axios.post("/api/challenge/chat/poll/vote", {
        challengeId,
        pollId,
        optionId,
      });
    } catch (e) {
      console.error("Vote failed", e);
      loadMessages(); // Revert on error
    }
  };
  // Scroll listener effect (Down Arrow visibility)
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (!viewport) return;

    const onScroll = () => {
      if (isAutoScrollingRef.current) return;
      if (isAtBottom()) {
        setShowScrollArrow(false);
        setHasNewMessages(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    viewport.addEventListener("scroll", onScroll);
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);
  // --- Realtime Messages ---
  useEffect(() => {
    loadMessages();
    const channel = supabaseClient.channel(`challenge-chat-${challengeId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        const incoming = payload.payload as Msg;

        if (incoming.type === "USER" && incoming.userId === currentUserId)
          return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          const updated = [...prev, incoming];
          if (isAtBottom()) {
            setTimeout(scrollBottom, 50);
            setHasNewMessages(false);
            setShowScrollArrow(false);
          } else {
            setHasNewMessages(true);
            setShowScrollArrow(true);
          }
          return updated;
        });
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const p = payload.payload as
          | { name?: string; userId?: string }
          | undefined;
        if (!p) return;
        if (p.userId === currentUserId) return;
        if (!p.name) return;
        setWhoIsTyping(p.name);
        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(
          () => setWhoIsTyping(null),
          2500
        );
      })
      .on("broadcast", { event: "reaction_update" }, (payload) => {
        const { messageId, reactions } = payload.payload as {
          messageId: string;
          reactions: Reaction[];
        };
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, reactions } : msg
          )
        );
      })
      // ✅ Poll Realtime Listener (Updates the poll when ANYONE votes)
      .on("broadcast", { event: "poll_update" }, (payload) => {
        const { messageId, poll } = payload.payload as {
          messageId: string;
          poll: PollData;
        };
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, poll } : msg))
        );
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
      if (typingTimeoutRef.current)
        window.clearTimeout(typingTimeoutRef.current);
      if (typingSentResetRef.current)
        window.clearTimeout(typingSentResetRef.current);
    };
  }, [challengeId, currentUserId]);

  // Footer IntersectionObserver (initial auto-scroll)

  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const scrollContainer = scrollRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]"
          ) as HTMLElement | null;
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: "smooth",
            });
          } else {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !currentUserId) return;

    const currentReply = replyingTo;
    setReplyingTo(null);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const optimistic: Msg = {
      id: `optimistic-${Date.now()}`,
      message: text,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
      challengeId,
      user: {
        id: currentUserId,
        name: session.data?.user.name ?? "You",
        image: session.data?.user.image ?? null,
      },
      reactions: [],
      replyTo: currentReply
        ? {
            id: currentReply.id,
            message: currentReply.message!,
            user: { name: currentReply.user?.name ?? "User" },
          }
        : null,
      __optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollBottom(), 0);
    setShowScrollArrow(false);
    setHasNewMessages(false);

    try {
      const res = await axios.post(`/api/challenge/chat/send`, {
        challengeId,
        message: text,
        replyToId: currentReply?.id,
      });
      const saved: Msg = res.data;
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
        return [...withoutOptimistic, saved];
      });
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error("Send failed", e);
    }
  };

  // --- Mention handlers ---
  const handleSuggestionClick = (suggestion: MentionSuggestion) => {
    if (mentionStartIndex === -1) return;

    const mentionText = `@${suggestion.display} `;
    const part1 = input.substring(0, mentionStartIndex);
    const part2 = input.substring(mentionStartIndex + mentionQuery.length + 1);

    const newText = part1 + mentionText + part2;
    setInput(newText);

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

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setInput(text);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setShowSuggestions(false);
      setMentionStartIndex(-1);
    } else {
      const textAfterAt = textBeforeCursor.substring(atIndex);
      if (/^@\[[^\]]+\]\([^)]+\)$/.test(textAfterAt)) {
        setShowSuggestions(false);
        setMentionStartIndex(-1);
      } else {
        const query = textBeforeCursor.substring(atIndex + 1);
        if (/\s/.test(query) || /@/.test(query)) {
          setShowSuggestions(false);
          setMentionStartIndex(-1);
        } else {
          setMentionQuery(query);
          setMentionStartIndex(atIndex);
          const filteredSuggestions = allMembersData.filter((member) =>
            member.display.toLowerCase().includes(query.toLowerCase())
          );
          setSuggestions(filteredSuggestions);
          setShowSuggestions(filteredSuggestions.length > 0);
          setActiveSuggestionIndex(0);
        }
      }
    }

    if (!channelRef.current || !session.data?.user?.name) return;

    if (!isTypingSentRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { name: session.data.user.name, userId: currentUserId },
      });
      isTypingSentRef.current = true;
      if (typingSentResetRef.current) {
        window.clearTimeout(typingSentResetRef.current);
      }
      typingSentResetRef.current = window.setTimeout(() => {
        isTypingSentRef.current = false;
        typingSentResetRef.current = null;
      }, 1500);
    }
  };

  const handleKeyDownOnTextarea = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
        return;
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (e.shiftKey && e.key === "Enter") return;
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, 0);
  };

  const getReactionTabs = (reactions: Reaction[] = []) => {
    const uniqueEmojis = Array.from(new Set(reactions.map((r) => r.emoji)));
    return { uniqueEmojis, allReactions: reactions };
  };

  const UserReactionRow = ({ reaction }: { reaction: Reaction }) => {
    const isMe = reaction.userId === currentUserId;
    const name = isMe ? "You" : (reaction.user?.name ?? "Unknown");
    return (
      <Link
        href={`/profile/${reaction.userId}`}
        target="_blank"
        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={reaction.user?.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(reaction.user?.name ?? "")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700">{name}</span>
        </div>
        <span className="text-lg">{reaction.emoji}</span>
      </Link>
    );
  };

  return (
    // ✅ FIX: Added w-full, max-w-full and overflow-hidden to container
    <Card className="flex flex-col h-[550px] mt-10 relative w-full max-w-full overflow-visible">
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
        <p className="text-sm text-green-700 mt-1 animate-pulse">
          {whoIsTyping && `${whoIsTyping} is typing…`}
        </p>
      </CardHeader>
      <ScrollArea ref={scrollRef} className="flex-1 w-full overflow-x-auto">
        <CardContent
          // onScroll={handleScroll}
          className="flex flex-col justify-end min-h-[350px] h-full  overflow-x-auto p-4 space-y-6 bg-muted/20 w-full"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-gray-500 italic">
              No messages yet — start the conversation 👋
            </div>
          ) : (
            <div className="space-y-6 pb-2 w-full">
              {messages.map((msg) => {
                if (msg.type === "SYSTEM") {
                  const joinedUserId = msg.meta?.joinedUserId;
                  const joinedUserName = msg.meta?.joinedUserName;

                  const remainingMessage =
                    joinedUserName && msg.message
                      ? msg.message.replace(joinedUserName, "").trim()
                      : msg.message;

                  return (
                    <div
                      key={msg.id}
                      className="w-full flex justify-center my-2"
                    >
                      <div
                        className="
          px-3 py-1.5
          text-xs
          text-gray-700
          bg-gray-200
          rounded-full
          shadow-sm
        "
                      >
                        {joinedUserId && joinedUserName ? (
                          <>
                            <Link
                              href={`/profile/${joinedUserId}`}
                              target="_blank"
                              className="font-semibold hover:underline cursor-pointer"
                            >
                              {joinedUserName}
                            </Link>
                            <span className="ml-1">{remainingMessage}</span>
                          </>
                        ) : (
                          msg.message
                        )}
                      </div>
                    </div>
                  );
                }

                const isMe = msg.userId === currentUserId;
                const hasReactions = msg.reactions && msg.reactions.length > 0;
                const { uniqueEmojis, allReactions } = getReactionTabs(
                  msg.reactions ?? []
                );
                const isHighlighted = highlightedMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`flex items-end gap-2 group relative transition-colors duration-500 p-1 rounded w-full ${
                      isMe ? "justify-end mr-4" : "justify-start"
                    } ${isHighlighted ? "bg-yellow-100/80" : ""}`}
                  >
                    {!isMe && (
                      <Avatar className="w-8 h-8 self-end mb-4 shrink-0">
                        <AvatarImage
                          src={
                            msg.user?.image && !msg.user.image.endsWith("/0")
                              ? msg.user.image
                              : undefined
                          }
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(msg.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* ✅ FIX: Adjusted widths. Mobile max-w-[70%] allows room for avatar + padding. */}
                    <div
                      className="
    relative
    max-w-max
    flex flex-col
    min-w-fit
    overflow-visible
    whitespace-pre-wrap
    break-words
  "
                    >
                      <div
                        className={`px-4 py-2 rounded-lg shadow-sm z-10 relative ${
                          isMe
                            ? "bg-emerald-800 text-white rounded-br-none"
                            : "bg-white text-black rounded-bl-none border"
                        }`}
                      >
                        {/* Reply Context */}
                        {msg.replyTo && (
                          <div
                            onClick={() =>
                              msg.replyTo && scrollToMessage(msg.replyTo.id)
                            }
                            className={`mb-2 rounded-md overflow-hidden border-l-4 bg-black/10 p-1.5 cursor-pointer hover:opacity-80 transition-opacity ${
                              isMe
                                ? "border-emerald-300/70 text-white/90"
                                : "border-indigo-500/70 text-gray-800"
                            }`}
                          >
                            <p
                              className={`text-xs font-bold ${
                                isMe ? "text-emerald-200" : "text-indigo-600"
                              }`}
                            >
                              {msg.replyTo.user.name}
                            </p>
                            <p className="text-xs truncate opacity-90">
                              {msg.replyTo.message}
                            </p>
                          </div>
                        )}

                        {!isMe && (
                          <p className="text-xs font-semibold text-primary mb-1">
                            {msg.user?.name ?? "Member"}
                          </p>
                        )}

                        {/* ✅ FIX: Added break-words, break-all and whitespace-pre-wrap for safety */}
                        {msg.poll ? (
                          <div className="w-full overflow-hidden">
                            <PollBubble
                              poll={msg.poll}
                              currentUserId={currentUserId}
                              onVote={(optId) =>
                                handleVote(msg.poll!.id, optId)
                              }
                            />
                          </div>
                        ) : (
                          <p className="break-words whitespace-pre-wrap w-full max-w-full overflow-visible">
                            {renderMessageText(
                              msg.message,
                              isMe,
                              allMembersData
                            )}
                          </p>
                        )}

                        <p
                          className={`text-[10px] mt-1 text-right ${
                            isMe ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.__optimistic && isMe ? " • sending…" : ""}
                        </p>
                      </div>

                      {msg.type === "USER" &&
                        !isChatDisabled &&
                        !msg.__optimistic && (
                          <div
                            className={`absolute -top-2 flex gap-1 z-20    ${isMe ? "left-2 sm:-left-1" : "right-2 sm:-right-1"}`}
                          >
                            {/* Hide Reply button for polls for simplicity */}
                            {!msg.poll && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-white border shadow-sm"
                                onClick={() => {
                                  setReplyingTo(msg);
                                  setTimeout(() => {
                                    textareaRef.current?.focus();
                                  }, 50);
                                }}
                              >
                                <Reply className="w-3 h-3 text-gray-500" />
                              </Button>
                            )}

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full bg-white border shadow-sm"
                                >
                                  <SmilePlus className="w-3 h-3 text-gray-500" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-1 flex gap-1 rounded-full shadow-md bg-white"
                                side="top"
                              >
                                {QUICK_REACTIONS.map((emoji) => (
                                  <PopoverClose key={emoji} asChild>
                                    <button
                                      onClick={() =>
                                        handleReaction(msg.id, emoji)
                                      }
                                      className="hover:bg-gray-100 p-2 rounded-full text-lg transition-transform active:scale-110"
                                    >
                                      {emoji}
                                    </button>
                                  </PopoverClose>
                                ))}
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}

                      {hasReactions && (
                        <div
                          className={`absolute -bottom-5 flex gap-1 z-0 ${
                            isMe ? "right-0" : "left-0"
                          }`}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex gap-1 bg-white/95 border rounded-full px-1.5 py-0.5 shadow-sm text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                {uniqueEmojis.slice(0, 3).map((e) => (
                                  <span key={e}>{e}</span>
                                ))}
                                {allReactions.length > 1 && (
                                  <span className="ml-0.5 font-bold text-gray-600">
                                    {allReactions.length}
                                  </span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-60 sm:w-80 p-0"
                              align={isMe ? "end" : "start"}
                            >
                              <Tabs defaultValue="all" className="w-full">
                                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 h-12 overflow-x-auto no-scrollbar">
                                  <TabsTrigger
                                    value="all"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 text-xs"
                                  >
                                    All {allReactions.length}
                                  </TabsTrigger>
                                  {uniqueEmojis.map((emoji) => (
                                    <TabsTrigger
                                      key={emoji}
                                      value={emoji}
                                      className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 text-md"
                                    >
                                      {emoji}
                                    </TabsTrigger>
                                  ))}
                                </TabsList>
                                <ScrollArea className="max-h-[250px] sm:h-[250px]">
                                  <TabsContent value="all" className="m-0 p-0">
                                    <div className="p-2 space-y-1">
                                      {allReactions.map((r, i) => (
                                        <UserReactionRow key={i} reaction={r} />
                                      ))}
                                    </div>
                                  </TabsContent>
                                  {uniqueEmojis.map((emoji) => (
                                    <TabsContent
                                      key={emoji}
                                      value={emoji}
                                      className="m-0 p-0"
                                    >
                                      <div className="p-2 space-y-1">
                                        {allReactions
                                          .filter((r) => r.emoji === emoji)
                                          .map((r, i) => (
                                            <UserReactionRow
                                              key={i}
                                              reaction={r}
                                            />
                                          ))}
                                      </div>
                                    </TabsContent>
                                  ))}
                                </ScrollArea>
                              </Tabs>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>
      </ScrollArea>

      {!isChatDisabled && showScrollArrow && (
        <Button
          size="sm"
          onClick={() => {
            isAutoScrollingRef.current = true;
            scrollBottom();
            setHasNewMessages(false);
            setShowScrollArrow(false);
            setTimeout(() => {
              isAutoScrollingRef.current = false;
            }, 400);
          }}
          className="absolute bottom-36 z-50 left-1/2 -translate-x-1/2 rounded-full bg-gray-700 shadow-lg"
        >
          <ArrowDown className="w-5 h-5 text-white" />
          {hasNewMessages && (
            <span className="absolute top-0 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>
          )}
        </Button>
      )}

      <CardFooter
        ref={footerRef}
        className="border-t w-full p-3 flex flex-col gap-2 bg-white z-30 rounded-b-xl"
      >
        {isChatDisabled ? (
          <div className="flex items-center justify-center w-full h-20 bg-red-50 text-red-700 font-medium">
            Chat is disabled — this challenge has ended.
          </div>
        ) : (
          <>
            {replyingTo && (
              <div className="w-full flex items-center justify-between bg-gray-50 p-2 rounded-lg border-l-4 border-indigo-500 animate-in slide-in-from-bottom-2">
                <div className="flex flex-col overflow-hidden pl-1">
                  <span className="text-xs font-bold text-indigo-600">
                    Replying to {replyingTo.user?.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {replyingTo.message}
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="hover:bg-gray-200 p-1 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            <div className="w-full flex items-end gap-2 relative">
              <div className="relative w-full flex-1 overflow-visible">
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute -bottom-full left-0 right-0 mb-2 z-50 max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none p-1">
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
                        <span className="font-medium">
                          {suggestion.display}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative w-full">
                  {/* ✅ FIX: Added w-full to Textarea */}
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDownOnTextarea}
                    placeholder="Type a message... @ to mention."
                    className="
      min-h-[45px] 
      max-h-[150px] 
      py-8 
      pl-4    /* increased left padding */
      pr-24 
      resize-none 
      w-full 
      rounded-xl
    "
                    style={{ lineHeight: "1.4" }} // fixes cursor alignment when wrapping
                  />

                  {/* Poll Button - align to TOP instead of bottom */}
                  <button
                    onClick={() => setIsPollModalOpen(true)}
                    className="
      absolute left-3 top-1
      text-gray-500 hover:text-indigo-600
      h-7 w-7 flex items-center justify-center
    "
                  >
                    <BarChartHorizontal className="w-5 h-5" />
                  </button>

                  {/* Emoji Button - align to TOP */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="
          absolute left-12 top-1
          text-gray-500 hover:text-indigo-600
          h-7 w-7 flex items-center justify-center
        "
                      >
                        <SmilePlus className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-64 p-2"
                      side="top"
                      align="start"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleInsertEmoji(emoji)}
                            className="text-2xl hover:bg-gray-100 p-2 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="
      absolute right-3 top-2
      bg-indigo-600 hover:bg-indigo-700 
      text-white rounded-full 
      p-2 h-9 w-9 
      flex items-center justify-center
      disabled:opacity-50
    "
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardFooter>

      {/* ✅ Render Poll Creation Modal */}
      <PollCreationModal
        isOpen={isPollModalOpen}
        onOpenChange={setIsPollModalOpen}
        onCreatePoll={handleCreatePoll}
      />
    </Card>
  );
}
