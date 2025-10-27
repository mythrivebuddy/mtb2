// app/(userDashboard)/dashboard/accountability-hub/member/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    name: string | null;
    image: string | null;
  };
};

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const memberId = params.id as string;
  const groupId = searchParams.get("groupId");
  const [isNudging, setIsNudging] = useState(false);

  const { data: member, error, isLoading } = useSWR(
    memberId && groupId
      ? `/api/accountability-hub/members/${memberId}?groupId=${groupId}`
      : null,
    fetcher
  );

  const handleSendNudge = async () => {
    setIsNudging(true);
    try {
        const response = await fetch(`/api/accountability-hub/members/${memberId}/nudge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to send nudge.");
        }
        
        toast({ title: "Nudge sent successfully!" });
    } catch (err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsNudging(false);
    }
  };

  if (isLoading) return <MemberPageSkeleton />;
  if (error || !member) return <div className="p-8 text-center text-red-500">Failed to load member details. Please try again.</div>;

  const latestGoal = member.goals?.[0];
  const isAdmin = member.requesterRole === 'admin';

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
          src={member.user.image || "/public-avatar.jpg"}
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
                        For cycle: {format(new Date(latestGoal.cycle.startDate), "MMM d")} - {format(new Date(latestGoal.cycle.endDate), "MMM d, yyyy")}
                    </p>
                </div>
                <Badge variant={latestGoal.status === 'on_track' ? 'default' : latestGoal.status === 'needs_attention' ? 'secondary' : 'destructive'} className="capitalize">
                    {latestGoal.status.replace('_', ' ')}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
          <p className="text-gray-800 text-lg p-4 bg-slate-50 rounded-md">{`"${latestGoal.text}"`}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="font-semibold text-gray-700">Midway Update</p>
                    <p className="text-gray-600 mt-1">{latestGoal.midwayUpdate || 'Pending...'}</p>
                </div>
                 <div>
                    <p className="font-semibold text-gray-700">End Result</p>
                    <p className="text-gray-600 mt-1">{latestGoal.endResult || 'Pending...'}</p>
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
                    {latestGoal.comments.length > 0 ? latestGoal.comments.map((comment: Comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Image src={comment.author.image || '/default-avatar.png'} alt={comment.author.name || 'User'} width={32} height={32} className="rounded-full mt-1"/>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold">{comment.author.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                                </div>
                                <p className="text-sm text-foreground">{comment.text}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground py-4">No comments yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {isAdmin && (
        <div className="mt-8">
            <Button 
                className="bg-gray-900 text-white hover:bg-gray-800"
                onClick={handleSendNudge}
                disabled={isNudging}
            >thisone
              {isNudging ? "Sending..." : "Send Nudge"}
            </Button>
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