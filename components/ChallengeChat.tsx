"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { supabaseClient } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { Send, ArrowDown } from "lucide-react";
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

import Link from "next/link";

type Msg = {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  challengeId: string;
  user?: { id: string; name: string; image: string | null };
  __optimistic?: boolean;
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return "M";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// ✅ Typing Indicator
const TypingIndicator = ({ name }: { name: string }) => (
  <div className="flex items-center justify-start mb-1">
    <div className="bg-white/5 px-3 py-2 rounded-xl rounded-bl-none shadow border">
      <div className="flex gap-1 items-center pl-1">
        <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-gray-800 rounded-full animate-whatsapp-bounce"></span>
      </div>
      <p className="text-xs font-semibold text-primary">{name} is typing…</p>
    </div>
  </div>
);

// ✅ Auto-detect links
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
            className={`${isMe ? "text-blue-300" : "text-blue-600"} underline`}
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
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isTypingRef = useRef(false);

  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
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

  // ✅ Load messages
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

  // ✅ Supabase listeners
  useEffect(() => {
    loadMessages();

    const channel = supabaseClient.channel(`challenge-chat-${challengeId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        const incoming = payload.payload as Msg;

        // ignore echo
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

        typingTimeoutRef.current = setTimeout(
          () => setWhoIsTyping(null),
          2500
        );
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [challengeId, currentUserId]);

  // ✅ FIX: Replace optimistic message properly
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
      __optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);

    // scrollBottom();
    setTimeout(()=>scrollBottom(),0)
    setShowScrollArrow(false);
    setHasNewMessages(false);

    try {
      const res = await axios.post(`/api/challenge/chat/send`, {
        challengeId,
        message: text,
      });
      const saved: Msg = res.data;

      // ✅ FIX B: Remove optimistic, append real message
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

  return (
    <Card className="flex flex-col h-[600px] mt-10 relative">
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>

        {whoIsTyping && (
          <p className="text-sm text-green-700 mt-1 animate-pulse">
            {whoIsTyping} is typing…
          </p>
        )}
      </CardHeader>

      {/* ✅ Scroll area */}
      <CardContent
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
      >
        {messages.map((msg) => {
          const isMe = msg.userId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <Avatar className="w-8 h-8 self-end">
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

              <div
                className={`max-w-[70%] min-w-24 px-4 py-2 rounded-lg shadow-sm ${
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
            </div>
          );
        })}

        {whoIsTyping && <TypingIndicator name={whoIsTyping} />}

        <div ref={bottomRef} />
      </CardContent>

      {/* ✅ FLOATING SCROLL ARROW */}
      {!isChatDisabled && showScrollArrow && (
        <Button
          size="sm"
          onClick={() => {
            scrollBottom();
            setHasNewMessages(false);
            setShowScrollArrow(false);
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-gray-700 shadow-lg"
        >
          <ArrowDown className="w-5 h-5 text-white" />
          {hasNewMessages && (
            <span className="absolute top-0 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>
          )}
        </Button>
      )}

      {/* Footer */}
      <CardFooter className="border-t w-full p-3">
  {isChatDisabled ? (
    <div className="flex items-center justify-center w-full h-20 bg-red-50 text-red-700 font-medium">
      Chat is disabled — this challenge has ended.
    </div>
  ) : (
    <div className="relative w-full">
      {/* ✅ Full-Width Textarea */}
      <Textarea
        ref={textareaRef}
        rows={1}
        placeholder="Type a message…"
        value={input}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        className="min-h-12 max-h-[150px] resize-none w-full pr-12"
      />

      {/* ✅ Send button INSIDE textarea (absolute) */}
      <button
        onClick={sendMessage}
        disabled={!input.trim()}
        className="
          absolute 
          right-2 
          bottom-2 
          bg-gradient-to-r 
          from-blue-600 
          to-indigo-700 
          hover:from-blue-700 
          hover:to-indigo-800 
          disabled:opacity-40
          rounded-full 
          p-2
          flex 
          items-center 
          justify-center
        "
      >
        <Send className="w-5 h-5 text-white" />
      </button>
    </div>
  )}
</CardFooter>

    </Card>
  );
}

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
