"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // ✅ Import Link
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ✅ Define a type for our suggestion data
type MentionSuggestion = {
  id: string;
  display: string;
  image: string | null;
};

// ✅ Define the Member type
type Member = {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

// ✅ Type for the new SWR fetch
type GroupViewData = {
  members: Member[];
};

// ✅ Fix the Comment type
type Comment = {
  id: string;
  createdAt: string;
  content: string; // Only content is needed
  author: {
    name: string;
    image: string | null;
  };
};

// ✅ --- COPIED from CommentsModal.tsx ---
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
          key={`${member.id}-${index}`}
          href={`/dashboard/accountability-hub/member/${member.id}?groupId=${groupId}`}
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
// ✅ --- END of copied function ---

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const groupId = searchParams.get("groupId");
  // const [isNudging, setIsNudging] = useState(false);

  // This fetches the specific member's details
  const {
    data: member,
    error,
    isLoading,
  } = useSWR(
    memberId && groupId
      ? `/api/accountability-hub/members/${memberId}?groupId=${groupId}`
      : null,
    fetcher
  );

  // ✅ --- NEW SWR FETCH ---
  // We also need to fetch ALL members in the group to render mentions
  const { data: groupData } = useSWR<GroupViewData>(
    groupId ? `/api/accountability-hub/groups/${groupId}/view` : null,
    fetcher
  );

  // ✅ Format all members for the render function
  const allMembersData: MentionSuggestion[] =
    groupData?.members.map((member) => ({
      id: member.user.id,
      display: member.user.name || "User",
      image: member.user.image,
    })) || [];
  // ✅ --- END of new data fetching ---

  // const handleSendNudge = async () => {
  //   setIsNudging(true);
  //   try {
  //     const response = await fetch(
  //       `/api/accountability-hub/members/${memberId}/nudge`,
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ groupId }),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || "Failed to send nudge.");
  //     }

  //     toast({ title: "Nudge sent successfully!" });
  //   } catch (err) {
  //     toast({
  //       title: "Error",
  //       description: (err as Error).message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsNudging(false);
  //   }
  // };

  if (isLoading) return <MemberPageSkeleton />;
  if (error || !member)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load member details. Please try again.
      </div>
    );

  const latestGoal = member.goals?.[0];
  const isAdmin = member.requesterRole === "ADMIN";
  console.log({isAdmin});
  

  return (
    <section className="mx-auto max-w-4xl py-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>
      <p className="text-sm text-muted-foreground mb-4">
        Accountability Hub / {member.group.name} /{" "}
        <span className="text-gray-700 font-medium">{member.user.name}</span>
      </p>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Image
          src={
            member.user.image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              member.user.name
            )}&background=random&color=fff`
          }
          alt={member.user.name || "User"}
          width={80}
          height={80}
          className="h-20 w-20 rounded-full border object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{member.user.name}</h1>
        </div>
      </div>

      {/* Goal Details Card */}
      {latestGoal ? (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Current Goal</CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  For cycle:{" "}
                  {format(new Date(latestGoal.cycle.startDate), "MMM d")} -{" "}
                  {format(new Date(latestGoal.cycle.endDate), "MMM d, yyyy")}
                </p>
              </div>
              <Badge
                variant={
                  latestGoal.status === "on_track"
                    ? "default"
                    : latestGoal.status === "needs_attention"
                    ? "secondary"
                    : "destructive"
                }
                className="capitalize"
              >
                {latestGoal.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-800 text-lg p-4 bg-slate-50 rounded-md">{`"${latestGoal.text}"`}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Midway Update</p>
                <p className="text-gray-600 mt-1">
                  {latestGoal.midwayUpdate || "Pending..."}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">End Result</p>
                <p className="text-gray-600 mt-1">
                  {latestGoal.endResult || "Pending..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardContent className="p-6 text-center text-gray-500">
            This member has not set a goal for the current cycle yet.
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      {latestGoal && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestGoal.comments.length > 0 ? (
                latestGoal.comments.map((comment: Comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Image
                      src={
                        comment.author.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment?.author?.name
                        )}&background=random&color=fff`
                      }
                      alt={comment.author.name || "User"}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{comment.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {/* ✅ MODIFIED LINE */}
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {renderCommentContent(
                          comment.content,
                          groupId,
                          allMembersData
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No comments yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {isAdmin && (
        <div className="mt-8">
          <Link href={`/dashboard/accountability-hub/send-nudge-page?memberId=${member.userId}&groupId=${groupId}&memberName=${member.user.name}`}>
          <Button
            className="bg-gray-900 text-white hover:bg-gray-800"
            // onClick={handleSendNudge}
            // disabled={isNudging}
          >
            {/* {isNudging ? "Sending..." : "Send Nudge"} */}
            Send Nudge
          </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

const MemberPageSkeleton = () => (
  <section className="mx-auto max-w-4xl py-8 px-4 animate-pulse">
    <Skeleton className="h-6 w-24 mb-4" />
    <Skeleton className="h-5 w-1/2 mb-4" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
    <Skeleton className="h-48 w-full mt-8 rounded-lg" />
    <Skeleton className="h-32 w-full mt-6 rounded-lg" />
  </section>
);