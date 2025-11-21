import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/utils"; // Using your provided path
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---
type Vote = { userId: string; user: { name: string | null; image: string | null } };
type Option = { id: string; text: string; votes: Vote[] };
type Poll = { id: string; question: string; allowMultiple: boolean; options: Option[] };

// --- Helpers ---
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getOptionLetter = (index: number) => String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.

// --- Sub-Component: User Row in Popover ---
const PollVoterRow = ({ vote }: { vote: Vote }) => {
  return (
    <Link
      href={`/profile/${vote.userId}`}
      target="_blank"
      className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
    >
      <Avatar className="w-8 h-8 border border-gray-100">
        <AvatarImage src={vote.user?.image ?? undefined} />
        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
          {getInitials(vote.user?.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-gray-700 truncate">
        {vote.user.name || "Unknown User"}
      </span>
    </Link>
  );
};

export function PollBubble({ 
  poll, 
  currentUserId, 
  onVote 
}: { 
  poll: Poll; 
  currentUserId?: string; 
  onVote: (optionId: string) => void 
}) {
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);

  // Find the first option that has votes to set as default tab, otherwise first option
  const defaultTab = poll.options.find(o => o.votes.length > 0)?.id || poll.options[0]?.id;

  return (
    <div className="min-w-[200px] sm:min-w-[320px] p-1 select-none">
      {/* Question */}
      <h3 className="font-semibold text-base mb-1 leading-snug">
        {poll.question}
      </h3>
      
      {/* Subtitle */}
      <p className="text-[11px] mb-3 font-medium uppercase tracking-wide">
        {poll.allowMultiple ? "Select one or more" : "Select one"}
      </p>

      {/* Options List (Main Chat Bubble) */}
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const voteCount = option.votes.length;
          const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
          const isVoted = option.votes.some(v => v.userId === currentUserId);
          // const letter = getOptionLetter(index);

          return (
            <button
              key={option.id || index}
              onClick={() => onVote(option.id)}
              className="w-full relative block group rounded-xl overflow-hidden transition-all active:scale-[0.99]"
            >
              {/* Border */}
              <div className="absolute inset-0 border border-gray-200 rounded-xl z-10 pointer-events-none" />
              
              {/* Progress Bar Layer */}
              <div className="absolute inset-0 rounded-xl overflow-hidden h-full w-full bg-white">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-out origin-left",
                    isVoted ? "bg-[#00a884]/15" : "bg-gray-100" 
                  )}
                  style={{ width: voteCount > 0 ? `${percentage}%` : '0%' }}
                />
              </div>

              {/* Content Layer */}
              <div className="relative p-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-3 text-left max-w-[85%]">
                  {/* Checkmark/Circle */}
                  {isVoted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00a884] shrink-0 fill-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 fill-white group-hover:text-gray-400 shrink-0" />
                  )}
                  
                  {/* Option Text */}
                  <span className="text-[15px] font-medium text-gray-900 leading-tight truncate">
                    {option.text}
                  </span>
                </div>
                
                {/* Vote Count */}
                {voteCount > 0 && (
                  <span className="text-xs font-medium text-gray-600 shrink-0">
                    {voteCount}
                  </span>
                )}
              </div>
              
              {/* Avatar Stack */}
              {voteCount > 0 && (
                 <div className="absolute -bottom-1 right-1 flex -space-x-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                   {option.votes.slice(0,3).map((v, i) => (
                     <Avatar key={`${v.userId}-${i}`} className="w-4 h-4 border border-white ring-1 ring-white">
                       <AvatarImage src={v.user.image || undefined} />
                       <AvatarFallback className="text-[6px] bg-emerald-100 text-emerald-800">
                         {getInitials(v.user.name)}
                       </AvatarFallback>
                     </Avatar>
                   ))}
                 </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Footer: View Votes Button */}
      <div className="mt-4 pt-2 border-t border-gray-100 flex justify-center items-center">
        <Popover>
          <PopoverTrigger asChild>
             <button 
               className="text-[#00a884] text-sm font-medium bg-white px-6 py-1.5 rounded-full transition-colors hover:bg-gray-50"
               onClick={(e) => e.stopPropagation()} 
             >
                View votes
             </button>
          </PopoverTrigger>
          
          {/* Popover Content */}
          <PopoverContent className="w-80 p-0" align="center" side="bottom">
             <div className="p-3 border-b bg-gray-50/50">
               <h4 className="font-semibold text-sm text-gray-700">Poll Details</h4>
             </div>
             
             {totalVotes === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">
                 No votes yet.
               </div>
             ) : (
               <Tabs defaultValue={defaultTab} className="w-full">
                 
                 {/* A B C D Tabs */}
                 <div className="border-b bg-white px-2">
                    <TabsList className="flex w-full justify-start bg-transparent p-0 h-10 overflow-x-auto no-scrollbar">
                      {poll.options.map((opt, index) => (
                        <TabsTrigger 
                          key={opt.id} 
                          value={opt.id}
                          className="
                            rounded-none border-b-2 border-transparent 
                            data-[state=active]:border-[#00a884] data-[state=active]:text-[#00a884] 
                            px-4 h-full text-sm font-bold text-gray-500 bg-transparent shadow-none min-w-[50px]
                          "
                        >
                          {getOptionLetter(index)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                 </div>

                 <ScrollArea className="h-[300px] bg-white">
                   {poll.options.map((opt, index) => (
                     <TabsContent key={opt.id} value={opt.id} className="m-0 p-0">
                       <div className="p-4">
                         {/* Full Option Text Display */}
                         <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-[10px] font-bold text-white">
                                    {getOptionLetter(index)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 leading-tight">
                                        {opt.text}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {opt.votes.length} vote{opt.votes.length !== 1 && 's'}
                                    </p>
                                </div>
                            </div>
                         </div>

                         {/* Voters List */}
                         <div className="space-y-1">
                           {opt.votes.length === 0 ? (
                             <div className="py-8 text-center text-xs text-gray-400 italic">
                               No votes for this option yet.
                             </div>
                           ) : (
                             opt.votes.map((vote) => (
                               <PollVoterRow key={vote.userId} vote={vote} />
                             ))
                           )}
                         </div>
                       </div>
                     </TabsContent>
                   ))}
                 </ScrollArea>
               </Tabs>
             )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}