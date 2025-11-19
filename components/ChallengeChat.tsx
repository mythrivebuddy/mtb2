"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { supabaseClient } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { Send, ArrowDown, SmilePlus } from "lucide-react";
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

// --- Types ---
type Reaction = {
  emoji: string;
  userId: string;
  user: { name: string | null; image: string | null };
};

type Msg = {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  challengeId: string;
  user?: { id: string; name: string; image: string | null };
  reactions?: Reaction[];
  __optimistic?: boolean;
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// --- Helpers ---
const getInitials = (name: string | null | undefined) => {
  if (!name) return "M";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

function renderMessageText(text: string, isMe: boolean) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    const isUrl = /(https?:\/\/[^\s]+)/.test(part);
    if (isUrl) {
      return (
        <span key={index} className="inline-block">
          <Link
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`${
              isMe ? "text-blue-300" : "text-blue-600"
            } underline break-words break-all max-w-full inline-block`}
          >
            {part}
          </Link>{" "}
        </span>
      );
    }
    return (
      <span key={index} className="inline">
        {part}
      </span>
    );
  });
}

export default function ChallengeChat({
  challengeId,
  isChatDisabled,
}: {
  challengeId: string;
  isChatDisabled: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const session = useSession();
  const currentUserId = session.data?.user.id;
  const currentUserData = session.data?.user;
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isTypingRef = useRef(false);
  const footerRef = useRef<HTMLDivElement>(null);

  // --- Scrolling ---
  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const isAtBottom = () => {
    const el = scrollRef.current;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 20;
  };

  const handleScroll = () => {
    if (isAtBottom()) {
      setShowScrollArrow(false);
      setHasNewMessages(false);
    } else {
      setShowScrollArrow(true);
    }
  };

  // --- Logic ---
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

        let newReactions = [...existingReactions];

        if (myExistingIndex !== -1) {
          const currentEmoji = existingReactions[myExistingIndex].emoji;
          if (currentEmoji === emoji) {
            // Toggle Off
            newReactions.splice(myExistingIndex, 1);
          } else {
            // Swap
            newReactions[myExistingIndex] = {
              ...newReactions[myExistingIndex],
              emoji,
            };
          }
        } else {
          // Add
          newReactions.push({
            emoji,
            userId: currentUserId,
            user: {
              name: currentUserData?.name ?? "You",
              image: currentUserData?.image ?? null,
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

  // --- Realtime ---
  useEffect(() => {
    loadMessages();
    const channel = supabaseClient.channel(`challenge-chat-${challengeId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        const incoming = payload.payload as Msg;
        if (incoming.userId === currentUserId) return;
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
        if (payload.payload.userId === currentUserId) return;
        setWhoIsTyping(payload.payload.name);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setWhoIsTyping(null), 2500);
      })
      .on("broadcast", { event: "reaction_update" }, (payload) => {
        const { messageId, reactions } = payload.payload;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, reactions } : msg
          )
        );
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [challengeId, currentUserId]);

  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const scrollContainer = scrollRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]"
          );
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
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

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

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    if (!channelRef.current || !session.data?.user.name || isTypingRef.current)
      return;
    isTypingRef.current = true;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { name: session.data.user.name, userId: currentUserId },
    });
    setTimeout(() => {
      isTypingRef.current = false;
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Helper: Reaction Tabs Data ---
  const getReactionTabs = (reactions: Reaction[] = []) => {
    const uniqueEmojis = Array.from(new Set(reactions.map((r) => r.emoji)));
    return { uniqueEmojis, allReactions: reactions };
  };

  // --- Component: Row item for list ---
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
    <Card className="flex flex-col h-[550px] mt-10 relative">
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
        <p className="text-sm text-green-700 mt-1 animate-pulse">
          {whoIsTyping && `${whoIsTyping} is typing…`}
        </p>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex flex-col justify-end min-h-[350px] h-full overflow-y-auto p-4 space-y-6 bg-muted/20"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-gray-500 italic">
              No messages yet — start the conversation 👋
            </div>
          ) : (
            <div className="space-y-6 pb-2">
              {messages.map((msg) => {
                const isMe = msg.userId === currentUserId;
                const hasReactions = msg.reactions && msg.reactions.length > 0;
                const { uniqueEmojis, allReactions } = getReactionTabs(
                  msg.reactions
                );

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 group relative ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMe && (
                      <Avatar className="w-8 h-8 self-end mb-4">
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

                    {/* Message Bubble Wrapper */}
                    <div className="relative max-w-[70%] min-w-24">
                      <div
                        className={`px-4 py-2 rounded-lg shadow-sm z-10 relative ${
                          isMe
                            ? "bg-emerald-800 text-white rounded-br-none"
                            : "bg-white text-black rounded-bl-none border"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-semibold text-primary mb-1">
                            {msg.user?.name ?? "Member"}
                          </p>
                        )}
                        <p className="break-words">
                          {renderMessageText(msg.message, isMe)}
                        </p>
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

                      {/* ✅ 1. EMOJI PICKER (On Hover) */}
                      {!isChatDisabled && !msg.__optimistic && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`absolute -top-3 h-6 w-6 rounded-full bg-white border shadow-sm z-20 ${
                                isMe ? "-left-2" : "-right-2"
                              }`}
                            >
                              <SmilePlus className="w-3 h-3 text-gray-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-1 flex gap-1 rounded-full shadow-lg bg-white"
                            side="top"
                          >
                            {QUICK_REACTIONS.map((emoji) => (
                              <PopoverClose key={emoji} asChild>
                                <button
                                  // key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="hover:bg-gray-100 p-2 rounded-full text-lg transition-transform active:scale-110"
                                >
                                  {emoji}
                                </button>
                              </PopoverClose>
                            ))}
                          </PopoverContent>
                        </Popover>
                      )}

                      {/* ✅ 2. REACTION DISPLAY (Click to View Details via Popover) */}
                      {hasReactions && (
                        <div
                          className={`absolute -bottom-5 flex  gap-1 z-0 ${
                            isMe ? "right-0" : "left-0"
                          }`}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex gap-1 bg-white/95 border rounded-full px-1.5 py-0.5 shadow-sm text-sm cursor-pointer hover:bg-gray-50 transition-colors ">
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

                            {/* ✅ 3. THE POPOVER CONTENT WITH TABS */}
                            <PopoverContent
                              className="w-60 sm:w-80 p-0"
                              align={isMe ? "end" : "start"}
                            >
                              <Tabs defaultValue="all" className="w-full">
                                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 h-12 overflow-x-auto no-scrollbar">
                                  <TabsTrigger
                                    value="all"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none shadow-none bg-transparent h-full px-3 text-xs"
                                  >
                                    All {allReactions.length}
                                  </TabsTrigger>
                                  {uniqueEmojis.map((emoji) => (
                                    <TabsTrigger
                                      key={emoji}
                                      value={emoji}
                                      className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none shadow-none bg-transparent h-full px-3 text-md"
                                    >
                                      {emoji}{" "}
                                      {
                                        allReactions.filter(
                                          (r) => r.emoji === emoji
                                        ).length
                                      }
                                    </TabsTrigger>
                                  ))}
                                </TabsList>

                                <ScrollArea className="h-[250px]">
                                  {/* Tab: All */}
                                  <TabsContent value="all" className="m-0 p-0">
                                    <div className="p-2 space-y-1">
                                      {allReactions.map((r, i) => (
                                        <UserReactionRow key={i} reaction={r} />
                                      ))}
                                    </div>
                                  </TabsContent>

                                  {/* Tabs: Specific Emojis */}
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
            scrollBottom();
            setHasNewMessages(false);
            setShowScrollArrow(false);
          }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-gray-700 shadow-lg"
        >
          <ArrowDown className="w-5 h-5 text-white" />
          {hasNewMessages && (
            <span className="absolute top-0 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>
          )}
        </Button>
      )}

      <CardFooter ref={footerRef} className="border-t w-full p-3">
        {isChatDisabled ? (
          <div className="flex items-center justify-center w-full h-20 bg-red-50 text-red-700 font-medium">
            Chat is disabled — this challenge has ended.
          </div>
        ) : (
          <div className="relative w-full">
            <Textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type a message…"
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              className="min-h-12 max-h-[150px] resize-none w-full pr-12"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-40 rounded-full p-2 flex items-center justify-center"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

//! working code of comment
// "use client";

// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { supabaseClient } from "@/lib/supabaseClient";
// import { useSession } from "next-auth/react";
// import { Send, ArrowDown } from "lucide-react";
// import { RealtimeChannel } from "@supabase/supabase-js";

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
//   CardFooter,
// } from "@/components/ui/card";

// import Link from "next/link";
// import { ScrollArea } from "./ui/scroll-area";

// type Msg = {
//   id: string;
//   message: string;
//   createdAt: string;
//   userId: string;
//   challengeId: string;
//   user?: { id: string; name: string; image: string | null };
//   __optimistic?: boolean;
// };

// const getInitials = (name: string | null | undefined) => {
//   if (!name) return "M";
//   return name
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase();
// };

// // ✅ Typing Indicator
// const TypingIndicator = ({ name }: { name: string }) => (
//   <div className="flex items-center justify-start mb-1">
//     <div className="bg-white/5 px-3 py-2 rounded-xl rounded-bl-none shadow border">
//       <div className="flex gap-1 items-center pl-1">
//         <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce [animation-delay:-0.3s]"></span>
//         <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce [animation-delay:-0.15s]"></span>
//         <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce"></span>
//       </div>
//       <p className="text-xs font-semibold text-primary">{name} is typing…</p>
//     </div>
//   </div>
// );

// // ✅ Auto-detect links
// function renderMessageText(text: string, isMe: boolean) {
//   const urlRegex = /(https?:\/\/[^\s]+)/g;

//   return text.split(urlRegex).map((part, index) => {
//     const isUrl = /(https?:\/\/[^\s]+)/.test(part);

//     if (isUrl) {
//       return (
//         <span key={index} className="inline-block">
//           <Link
//             href={part}
//             target="_blank"
//             rel="noopener noreferrer"
//             className={`${isMe ? "text-blue-300" : "text-blue-600"} underline break-words break-all max-w-full inline-block`}
//           >
//             {part}
//           </Link>{" "}
//         </span>
//       );
//     }

//     return (
//       <span key={index} className="inline">
//         {part}
//       </span>
//     );
//   });
// }

// export default function ChallengeChat({
//   challengeId,
//   isChatDisabled,
// }: {
//   challengeId: string;
//   isChatDisabled: boolean;
// }) {
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [hasNewMessages, setHasNewMessages] = useState(false);
//   const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
//   const [showScrollArrow, setShowScrollArrow] = useState(false);

//   const session = useSession();
//   const currentUserId = session.data?.user.id;
//   const [input, setInput] = useState("");

//   const scrollRef = useRef<HTMLDivElement>(null);
//   const bottomRef = useRef<HTMLDivElement>(null);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const channelRef = useRef<RealtimeChannel | null>(null);
//   const isTypingRef = useRef(false);
//   const footerRef = useRef<HTMLDivElement>(null);

//   const scrollBottom = () => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "nearest",
//     });
//   };

//   const isAtBottom = () => {
//     const el = scrollRef.current;
//     if (!el) return false;
//     return el.scrollHeight - el.scrollTop - el.clientHeight < 20;
//   };

//   const handleScroll = () => {
//     if (isAtBottom()) {
//       setShowScrollArrow(false);
//       setHasNewMessages(false);
//     } else {
//       setShowScrollArrow(true);
//     }
//   };

//   // ✅ Load messages
//   const loadMessages = async () => {
//     try {
//       const res = await axios.get(`/api/challenge/chat/${challengeId}`);
//       setMessages(res.data);
//       setTimeout(() => {
//         if (!isAtBottom()) setShowScrollArrow(true);
//       }, 100);
//     } catch (error) {
//       console.error("Failed to load messages:", error);
//     }
//   };

//   // ✅ Supabase listeners
//   useEffect(() => {
//     loadMessages();

//     const channel = supabaseClient.channel(`challenge-chat-${challengeId}`);
//     channelRef.current = channel;

//     channel
//       .on("broadcast", { event: "new_message" }, (payload) => {
//         const incoming = payload.payload as Msg;

//         // ignore echo
//         if (incoming.userId === currentUserId) return;

//         setMessages((prev) => {
//           if (prev.some((m) => m.id === incoming.id)) return prev;

//           const updated = [...prev, incoming];

//           if (isAtBottom()) {
//             setTimeout(scrollBottom, 50);
//             setHasNewMessages(false);
//             setShowScrollArrow(false);
//           } else {
//             setHasNewMessages(true);
//             setShowScrollArrow(true);
//           }

//           return updated;
//         });
//       })
//       .on("broadcast", { event: "typing" }, (payload) => {
//         if (payload.payload.userId === currentUserId) return;

//         setWhoIsTyping(payload.payload.name);

//         if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

//         typingTimeoutRef.current = setTimeout(() => setWhoIsTyping(null), 2500);
//       })
//       .subscribe();

//     return () => {
//       supabaseClient.removeChannel(channel);
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     };
//   }, [challengeId, currentUserId]);

// // Detect when textarea/footer is visible — then scroll the *actual* chat area

// useEffect(() => {
//   if (!footerRef.current) return;

//   const observer = new IntersectionObserver(
//     (entries,obs) => {
//       const [entry] = entries;
//       if (entry.isIntersecting) {
//         console.log("Textarea is visible ✅");
//         // ✅ Scroll the actual ScrollArea content, not the wrapper
//         const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
//         if (scrollContainer) {
//           scrollContainer.scrollTo({
//             top: scrollContainer.scrollHeight,
//             behavior: "smooth",
//           });
//         } else {
//           // fallback to bottom ref (in case ScrollArea structure changes)
//           bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//         }
//                // ✅ Stop observing after first trigger
//         obs.disconnect();
//       }
//     },
//     { threshold: 0.3 }
//   );

//   observer.observe(footerRef.current);
//   return () => observer.disconnect();
// }, []);

//   // ✅ FIX: Replace optimistic message properly
//   const sendMessage = async () => {
//     const text = input.trim();
//     if (!text || !currentUserId) return;

//     setInput("");
//     if (textareaRef.current) textareaRef.current.style.height = "auto";

//     const optimistic: Msg = {
//       id: `optimistic-${Date.now()}`,
//       message: text,
//       createdAt: new Date().toISOString(),
//       userId: currentUserId,
//       challengeId,
//       user: {
//         id: currentUserId,
//         name: session.data?.user.name ?? "You",
//         image: session.data?.user.image ?? null,
//       },
//       __optimistic: true,
//     };

//     setMessages((prev) => [...prev, optimistic]);

//     // scrollBottom();
//     setTimeout(() => scrollBottom(), 0);
//     setShowScrollArrow(false);
//     setHasNewMessages(false);

//     try {
//       const res = await axios.post(`/api/challenge/chat/send`, {
//         challengeId,
//         message: text,
//       });
//       const saved: Msg = res.data;

//       // ✅ FIX B: Remove optimistic, append real message
//       setMessages((prev) => {
//         const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
//         return [...withoutOptimistic, saved];
//       });
//     } catch (e) {
//       setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
//       console.error("Send failed", e);
//     }
//   };

//   const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setInput(e.target.value);

//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
//     }

//     if (!channelRef.current || !session.data?.user.name || isTypingRef.current)
//       return;

//     isTypingRef.current = true;

//     channelRef.current.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { name: session.data.user.name, userId: currentUserId },
//     });

//     setTimeout(() => {
//       isTypingRef.current = false;
//     }, 2000);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <Card className="flex flex-col h-[550px] mt-10 relative">
//       <CardHeader>
//         <CardTitle>Group Chat</CardTitle>

//           <p className="text-sm text-green-700 mt-1 animate-pulse">
//         {whoIsTyping && `${whoIsTyping} is typing…`}
//           </p>
//       </CardHeader>
//       {/* ✅ Scroll area */}
//       <ScrollArea className="flex-1">
//       <CardContent
//         ref={scrollRef}
//         onScroll={handleScroll}
//         className="flex flex-col justify-end min-h-[350px] h-full overflow-y-auto p-4 space-y-4 bg-muted/20"
//       >
//         {
//           messages.length == 0 ? (
//              <div className="flex flex-1 items-center justify-center text-gray-500 italic">
//         No messages yet — start the conversation 👋
//       </div>
//           ) :(
//              <div className="space-y-4">
//                   {messages.map((msg) => {
//           const isMe = msg.userId === currentUserId;

//           return (
//             <div
//               key={msg.id}
//               className={`flex items-end gap-2 ${
//                 isMe ? "justify-end" : "justify-start"
//               }`}
//             >
//               {!isMe && (
//                 <Avatar className="w-8 h-8 self-end">
//                   <AvatarImage
//                     src={
//                       msg.user?.image && !msg.user.image.endsWith("/0")
//                         ? msg.user.image
//                         : undefined
//                     }
//                   />
//                   <AvatarFallback className="text-xs">
//                     {getInitials(msg.user?.name)}
//                   </AvatarFallback>
//                 </Avatar>
//               )}

//               <div
//                 className={`max-w-[70%] min-w-24 px-4 py-2 rounded-lg shadow-sm ${
//                   isMe
//                     ? "bg-emerald-800 text-white rounded-br-none"
//                     : "bg-white text-black rounded-bl-none border"
//                 }`}
//               >
//                 {!isMe && (
//                   <p className="text-xs font-semibold text-primary mb-1">
//                     {msg.user?.name ?? "Member"}
//                   </p>
//                 )}

//                 <p className="break-words">
//                   {renderMessageText(msg.message, isMe)}
//                 </p>

//                 <p
//                   className={`text-[10px] mt-1 text-right ${
//                     isMe ? "text-white/70" : "text-gray-500"
//                   }`}
//                 >
//                   {new Date(msg.createdAt).toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                   {msg.__optimistic && isMe ? " • sending…" : ""}
//                 </p>
//               </div>
//             </div>
//           );
//         })}

//         {whoIsTyping && <TypingIndicator name={whoIsTyping} />}

//         <div ref={bottomRef} />
//              </div>
//           )
//         }

//       </CardContent>
//       </ScrollArea>

//       {/* ✅ FLOATING SCROLL ARROW */}
//       {!isChatDisabled && showScrollArrow && (
//         <Button
//           size="sm"
//           onClick={() => {
//             scrollBottom();
//             setHasNewMessages(false);
//             setShowScrollArrow(false);
//           }}
//           className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-gray-700 shadow-lg"
//         >
//           <ArrowDown className="w-5 h-5 text-white" />
//           {hasNewMessages && (
//             <span className="absolute top-0 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>
//           )}
//         </Button>
//       )}

//       {/* Footer */}
//       <CardFooter ref={footerRef} className="border-t w-full p-3">
//         {isChatDisabled ? (
//           <div className="flex items-center justify-center w-full h-20 bg-red-50 text-red-700 font-medium">
//             Chat is disabled — this challenge has ended.
//           </div>
//         ) : (
//           <div className="relative w-full">
//             {/* ✅ Full-Width Textarea */}
//             <Textarea
//               ref={textareaRef}
//               rows={1}
//               placeholder="Type a message…"
//               value={input}
//               onChange={handleTyping}
//               onKeyDown={handleKeyDown}
//               className="min-h-12 max-h-[150px] resize-none w-full pr-12"
//             />

//             {/* ✅ Send button INSIDE textarea (absolute) */}
//             <button
//               onClick={sendMessage}
//               disabled={!input.trim()}
//               className="
//           absolute
//           right-2
//           bottom-2
//           bg-gradient-to-r
//           from-blue-600
//           to-indigo-700
//           hover:from-blue-700
//           hover:to-indigo-800
//           disabled:opacity-40
//           rounded-full
//           p-2
//           flex
//           items-center
//           justify-center
//         "
//             >
//               <Send className="w-5 h-5 text-white" />
//             </button>
//           </div>
//         )}
//       </CardFooter>
//     </Card>
//   );
// }

// "use client";

// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { supabaseClient } from "@/lib/supabaseClient";
// import { useSession } from "next-auth/react";
// // --- MODIFIED --- ChevronDown is no longer needed
// import { Send } from "lucide-react";
// import { RealtimeChannel } from "@supabase/supabase-js";

// // --- SHADCN IMPORTS ---
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
//   CardFooter,
// } from "@/components/ui/card";
// import Link from "next/link";

// type Msg = {
//   id: string;
//   message: string;
//   createdAt: string;
//   userId: string;
//   challengeId: string;
//   user?: { id: string; name: string; image: string | null };
//   __optimistic?: boolean;
// };

// const getInitials = (name: string | null | undefined) => {
//   if (!name) return "M";
//   return name
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase();
// };

// // --- Typing indicator now accepts and displays a name ---
// const TypingIndicator = ({ name }: { name: string }) => (
//   <div className="flex items-center justify-start">
//     <div
//       className="
//         bg-white/5
//         px-3 py-2
//         rounded-xl
//         shadow-xl
//         rounded-bl-none
//         w-fit
//         flex flex-col items-start gap-1
//         border border-gray-200
//       "
//     >
//       {/* WhatsApp Dot Animation */}
//       <div className="flex gap-1 items-center pl-1">
//         <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce [animation-delay:-0.3s]"></span>
//         <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce [animation-delay:-0.15s]"></span>
//         <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce"></span>
//       </div>
//       {/* Show the name */}
//       <p className="text-xs font-semibold text-primary">{name} is typing</p>
//     </div>
//   </div>
// );
// function renderMessageText(text: string, isMe: boolean) {
//   const urlRegex = /(https?:\/\/[^\s]+)/g;

//   return text.split(urlRegex).map((part, index) => {
//     const isUrl = /(https?:\/\/[^\s]+)/.test(part); // ✅ fresh regex, no mutation
//     if (isUrl) {
//       return (
//         <Link
//           key={index}
//           href={part}
//           target="_blank"
//           rel="noopener noreferrer"
//           className={`${isMe ? "text-blue-300" : "text-blue-600"} underline break-words`}
//         >
//           {part}
//         </Link>
//       );
//     }
//     return part; // normal text
//   });
// }

// export default function ChallengeChat({
//   challengeId,
//   isChatDisabled,
// }: {
//   challengeId: string;
//   isChatDisabled: boolean;
// }) {
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const session = useSession();
//   const currentUserId = session.data?.user.id;
//   const [input, setInput] = useState("");
//   const bottomRef = useRef<HTMLDivElement>(null);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const channelRef = useRef<RealtimeChannel | null>(null);
//   const isTypingRef = useRef(false);

//   // --- REMOVED --- All state and refs for the scroll button are gone.

//   const scrollBottom = () =>
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });

//   // --- MODIFIED --- This is the simple auto-scroll logic
//   useEffect(() => {
//     scrollBottom();
//   }, [messages, whoIsTyping]);

//   const loadMessages = async () => {
//     try {
//       const res = await axios.get(`/api/challenge/chat/${challengeId}`);
//       setMessages(res.data);
//       // --- MODIFIED --- No longer need special logic, the useEffect above will fire
//     } catch (error) {
//       console.error("Failed to load messages:", error);
//     }
//   };

//   // --- REMOVED --- The handleScroll function is no longer needed.

//   useEffect(() => {
//     loadMessages();
//     const channel = supabaseClient.channel(`challenge-chat-${challengeId}`);
//     channelRef.current = channel;

//     channel
//       .on("broadcast", { event: "new_message" }, (payload) => {
//         const newMessage = payload.payload as Msg;
//         if (newMessage.userId === currentUserId) return;

//         // --- MODIFIED --- Simplified logic. Just add the message.
//         // The useEffect on [messages] will handle the scrolling.
//         setMessages((prev) =>
//           prev.some((m) => m.id === newMessage.id)
//             ? prev
//             : [...prev, newMessage]
//         );
//       })
//       .on("broadcast", { event: "typing" }, (payload) => {
//         if (payload.payload.userId === currentUserId) return;
//         setWhoIsTyping(payload.payload.name);
//         if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//         typingTimeoutRef.current = setTimeout(() => {
//           setWhoIsTyping(null);
//         }, 3000);
//       })
//       .subscribe();

//     return () => {
//       supabaseClient.removeChannel(channel);
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [challengeId, currentUserId]);

//   const sendMessage = async () => {
//     const text = input.trim();
//     if (!text || !currentUserId) return;
//     setInput("");

//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//     }

//     const optimistic: Msg = {
//       id: `optimistic-${Date.now()}`,
//       message: text,
//       createdAt: new Date().toISOString(),
//       userId: currentUserId,
//       challengeId,
//       user: {
//         id: currentUserId,
//         name: session.data?.user.name ?? "You",
//         image: session.data?.user.image ?? null,
//       },
//       __optimistic: true,
//     };
//     setMessages((prev) => [...prev, optimistic]);

//     // --- REMOVED --- scrollBottom() call is no longer needed here.
//     // The useEffect on [messages] will handle it.

//     try {
//       const res = await axios.post(`/api/challenge/chat/send`, {
//         challengeId,
//         message: text,
//       });
//       const saved: Msg = res.data;
//       setMessages((prev) =>
//         prev.map((m) => (m.id === optimistic.id ? saved : m))
//       );
//     } catch (e) {
//       setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
//       console.error("Send failed", e);
//     }
//   };

//   const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setInput(e.target.value);
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
//     }
//     if (!channelRef.current || !session.data?.user.name || isTypingRef.current)
//       return;
//     isTypingRef.current = true;
//     channelRef.current.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { name: session.data.user.name, userId: currentUserId },
//     });
//     setTimeout(() => {
//       isTypingRef.current = false;
//     }, 2000);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <Card className="flex flex-col h-[600px] mt-10">
//       <CardHeader>
//         <CardTitle>Group Chat</CardTitle>
//       </CardHeader>

//       {/* --- MODIFIED --- Removed onScroll and ref --- */}
//       <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
//         {messages.map((msg) => {
//           const isMe = msg.userId === currentUserId;
//           return (
//             <div
//               key={msg.id}
//               className={`flex items-end gap-2 ${
//                 isMe ? "justify-end" : "justify-start"
//               }`}
//             >
//               {!isMe && (
//                 <Avatar className="w-8 h-8 self-end">
//                   <AvatarImage
//                     src={
//                       msg.user?.image && !msg.user.image.endsWith("/0")
//                         ? msg.user.image
//                         : undefined
//                     }
//                   />
//                   <AvatarFallback className="text-xs">
//                     {getInitials(msg.user?.name)}
//                   </AvatarFallback>
//                 </Avatar>
//               )}

//               <div
//                 className={`max-w-[70%] min-w-24 h-fit px-4 py-2 rounded-lg shadow-sm
//                 ${
//                   isMe
//                     ? "bg-emerald-800 text-primary-foreground rounded-br-none"
//                     : "bg-background text-foreground rounded-bl-none border"
//                 }`}
//               >
//                 {!isMe && (
//                   <p className="text-xs font-semibold text-primary mb-1">
//                     {msg.user?.name ?? "Member"}
//                   </p>
//                 )}
//                 <p className="break-words">
//                   {renderMessageText(msg.message, isMe)}
//                 </p>

//                 <p
//                   className={`text-[10px] mt-1 text-right ${
//                     isMe
//                       ? "text-primary-foreground/80"
//                       : "text-muted-foreground"
//                   }`}
//                 >
//                   {new Date(msg.createdAt).toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                   {msg.__optimistic && isMe ? " • sending…" : ""}
//                 </p>
//               </div>
//             </div>
//           );
//         })}

//         {/* --- Pass the name to the component --- */}
//         {whoIsTyping && <TypingIndicator name={whoIsTyping} />}

//         <div ref={bottomRef} />

//         {/* --- REMOVED --- The ChevronDown button is gone. --- */}
//       </CardContent>

//       <CardFooter className="flex border-t w-full p-0">
//         {isChatDisabled ? (
//           <div className="flex items-center justify-center w-full h-20 bg-red-50 text-red-700 font-medium">
//             Chat is disabled — this challenge has ended.
//           </div>
//         ) : (
//           <>
//             <Textarea
//               ref={textareaRef}
//               rows={1}
//               placeholder="Type a message…"
//               disabled={isChatDisabled}
//               value={input}
//               onChange={handleTyping}
//               onKeyDown={handleKeyDown}
//               className="min-h-10 max-h-[120px] resize-none"
//             />
//             <Button
//               size="icon"
//               onClick={sendMessage}
//               disabled={!input.trim() || isChatDisabled}
//               className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 flex-shrink-0"
//             >
//               <Send className="w-5 h-5" />
//             </Button>
//           </>
//         )}
//       </CardFooter>
//     </Card>
//   );
// }

// "use client";

// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { supabaseClient } from "@/lib/supabaseClient";
// import { useSession } from "next-auth/react";
// import { getAvatar } from "@/lib/utils/getDefaultAvatar";

// type Msg = {
//   id: string;
//   message: string;
//   createdAt: string;
//   userId: string;
//   challengeId: string;
//   user?: { id: string; name: string | null; image: string | null };
//   __optimistic?: boolean;
// };

// export default function ChallengeChat({
//   challengeId,
// }: {
//   challengeId: string;
// }) {
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const session = useSession();
//   const currentUserId = session.data?.user.id;
//   const [input, setInput] = useState("");
//   const bottomRef = useRef<HTMLDivElement>(null);

//   const scrollBottom = () =>
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   useEffect(scrollBottom, [messages]);

//   const loadMessages = async () => {
//     try {
//       const res = await axios.get(`/api/challenge/chat/${challengeId}`);
//       console.log("GEt all message api running ");
//       setMessages(res.data);
//       console.log({messages});

//     } catch (error) {
//       console.error("Failed to load messages:", error);
//     }
//   };

//   useEffect(() => {
//     // 1. Load initial messages
//     loadMessages();

//     // 2. Subscribe to the simple broadcast event
//     const channel = supabaseClient
//       .channel(`challenge-chat-${challengeId}`)
//       .on(
//         "broadcast", // <-- Listen for broadcast
//         { event: "new_message" }, // <-- Listen for our custom event
//         (payload) => {
//           // The payload *is* the full message, no fetch needed!
//           const newMessage = payload.payload as Msg;

//           // ✨ --- THIS IS THE FIX --- ✨
//           // If the new message is from the current user, ignore it.
//           // The 'sendMessage' function is already handling it.
//           if (newMessage.userId === currentUserId) { // <-- FIX
//             return;
//           }

//           // Update state functionally to avoid stale `messages` array
//           setMessages((prev) => {
//             // Check if we already have this message (just in case)
//             const alreadyExists = prev.some((m) => m.id === newMessage.id);
//             if (alreadyExists) {
//               return prev;
//             }
//             // This is a new message from *another* user. Add it.
//             return [...prev, newMessage];
//           });
//         }
//       )
//       .subscribe((status) => {
//         // Optional: check connected
//         // console.log("Realtime status:", status);
//       });

//     // 3. Cleanup
//     return () => {
//       supabaseClient.removeChannel(channel);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [challengeId, currentUserId]); // <-- FIX: Add currentUserId dependency

//   // Send + optimistic UI
//   const sendMessage = async () => {
//     const text = input.trim();
//     if (!text || !currentUserId) return;

//     setInput("");

//     // Optimistic item
//     const optimistic: Msg = {
//       id: `optimistic-${Date.now()}`,
//       message: text,
//       createdAt: new Date().toISOString(),
//       userId: currentUserId,
//       challengeId,
//       user: {
//         id: currentUserId,
//         name: session.data?.user.name ?? "You",
//         image: session.data?.user.image ?? null,
//       },
//       __optimistic: true,
//     };
//     setMessages((prev) => [...prev, optimistic]);

//     try {
//       const res = await axios.post(`/api/challenge/chat/send`, {
//         challengeId,
//         message: text,
//       });

//       const saved: Msg = res.data;

//       // Replace optimistic with real row
//       setMessages((prev) => {
//         return prev.map((m) => (m.id === optimistic.id ? saved : m));
//       });
//     } catch (e) {
//       // Rollback optimistic on error
//       setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
//       console.error("Send failed", e);
//       // TODO: Show error to user
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-2xl shadow-sm mt-10">
//       <h2 className="text-2xl font-bold text-gray-800 mb-4">Group Chat</h2>

//       <div className="h-96 overflow-y-auto border rounded-xl p-4 bg-gray-50 space-y-4">
//         {messages.map((msg) => {
//           const isMe = msg.userId === currentUserId;
//           console.log({messages});

//           return (
//             <div
//               key={msg.id}
//               className={`flex items-end gap-2 ${
//                 isMe ? "justify-end" : "justify-start"
//               }`}
//             >
//               {/* Avatar for receivers only */}
//               {!isMe && (
//                 <img
//                   src={msg.user?.image && !msg.user.image.endsWith("/0")
//                       ? msg.user.image : getAvatar(msg.user?.name ?? "Member")}
//                   className="w-8 h-8 rounded-full border self-end"
//                   alt=""
//                 />
//               )}

//               <div
//                 className={`max-w-[70%] px-4 py-2 rounded-2xl shadow
//                 ${
//                   isMe
//                     ? "bg-green-500 text-white rounded-br-none"
//                     : "bg-white text-gray-800 rounded-bl-none"
//                 }`}
//               >
//                 {!isMe && (
//                   <p className="text-xs font-semibold text-blue-600 mb-1">
//                     {msg.user?.name ?? "Member"}
//                   </p>
//                 )}
//                 <p className="whitespace-pre-wrap">{msg.message}</p>
//                 <p
//                   className={`text-[10px] mt-1 ${
//                     isMe ? "text-white/80" : "text-gray-500"
//                   }`}
//                 >
//                   {new Date(msg.createdAt).toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                   {msg.__optimistic && isMe ? " • sending…" : ""}
//                 </p>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={bottomRef} />
//       </div>

//       <div className="flex gap-2 mt-4">
//         <input
//           className="flex-1 border rounded-full px-4 py-2 bg-gray-100"
//           placeholder="Type a message…"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-green-600 text-white px-4 py-2 rounded-full"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }
