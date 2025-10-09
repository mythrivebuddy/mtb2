// app/(userDashboard)/dashboard/accountability-hub/cycle/[cycleId]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { ArrowLeft, Award, MessageSquare, Star } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
 import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const REWARD_AMOUNT = 100;

// --- THIS IS THE FIX ---
// Define a specific type for the member object to avoid using 'any'
type Member = {
  id: string;
  user: {
    name: string | null;
  };
};
// -----------------------

export default function CycleReportPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const cycleId = params.cycleId as string;
  const { width, height } = useWindowSize();

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isRewarding, setIsRewarding] = useState(false);

  const { data: report, error, isLoading, mutate } = useSWR(
    cycleId ? `/api/accountability-hub/cycles/${cycleId}/report` : null,
    fetcher
  );

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(memberId)) {
            newSet.delete(memberId);
        } else {
            newSet.add(memberId);
        }
        return newSet;
    });
  };

  const handleReward = async (memberIds: string[]) => {
    if (memberIds.length === 0) {
        toast({ title: "No members selected", description: "Please select at least one member to reward.", variant: "destructive" });
        return;
    }
    setIsRewarding(true);
    try {
        const response = await fetch(`/api/accountability-hub/cycles/${cycleId}/reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberIds })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to send rewards.");

        toast({ title: "Success!", description: result.message });
        setSelectedMembers(new Set());
        mutate();
    } catch (err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsRewarding(false);
    }
  };

  if (isLoading) return <ReportSkeleton />;
  if (error || !report) return <div className="p-8 text-center text-red-500">Failed to load cycle report.</div>;

  const { cycle, members, highlights } = report;

  return (
    <>
      <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />
      <section className="mx-auto max-w-4xl py-8 px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Hub</span>
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎉 Cycle Complete! 🎉</h1>
          <p className="text-muted-foreground mt-1">
            Reviewing cycle from {format(new Date(cycle.startDate), "MMM d")} to {format(new Date(cycle.endDate), "MMM d, yyyy")}
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Most Active Member</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highlights.mostActive?.name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">{highlights.mostActive?.updates || 0} progress updates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Most Supportive Member</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highlights.mostSupportive?.name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">{highlights.mostSupportive?.comments || 0} comments given</p>
            </CardContent>
          </Card>
        </div>

        {/* Reward Section */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500"/> Reward Members with JoyPearls</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Select members to reward for their participation in this cycle. Each rewarded member will receive {REWARD_AMOUNT} JoyPearls.</p>
                <div className="space-y-2 mb-4">
                    {members.map((member: Member) => ( // <-- FIX #1
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-md border has-[:checked]:bg-blue-50">
                           <label htmlFor={member.id} className="font-medium cursor-pointer">{member.user.name}</label>
                           <Checkbox id={member.id} checked={selectedMembers.has(member.id)} onCheckedChange={() => handleSelectMember(member.id)} />
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleReward(Array.from(selectedMembers))} disabled={isRewarding || selectedMembers.size === 0}>
                        {isRewarding ? 'Rewarding...' : `Reward Selected (${selectedMembers.size})`}
                    </Button>
                    <Button variant="secondary" onClick={() => handleReward(members.map((m: Member) => m.id))} disabled={isRewarding}> {/* <-- FIX #2 */}
                        {isRewarding ? 'Rewarding...' : `Reward All (${members.length})`}
                    </Button>
                </div>
            </CardContent>
        </Card>
      </section>
    </>
  );
}

const ReportSkeleton = () => (
    <section className="mx-auto max-w-4xl py-8 px-4 animate-pulse">
        <Skeleton className="h-6 w-24 mb-8" />
        <div className="text-center mb-8 space-y-2">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
    </section>
);