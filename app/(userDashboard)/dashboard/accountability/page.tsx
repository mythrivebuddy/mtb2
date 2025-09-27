// app/(userDashboard)/dashboard/accountability/page.tsx
"use client";

import { format } from "date-fns";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import useAccountabilityFeed from "@/hooks/useAccountabilityFeed"; // <<< FIX IS HERE
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JPCard from "@/components/dashboard/JPCard";
import ActivityFeed from "@/components/accountability/ActivityFeed";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AccountabilityHubHome() {
  const {
    data: groups,
    error,
    isLoading,
  } = useSWR("/api/accountability-hub/groups", fetcher);

  const group = groups?.[0];
  const activeCycle = group?.cycles?.[0];

  const groupId = group?.id;
  const { items: activityItems } = useAccountabilityFeed(groupId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load accountability hub.</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to the Accountability Hub!
        </h2>
        <p className="text-muted-foreground mb-4">
          Create a group to start tracking goals with your community.
        </p>
        <Link href="/dashboard/accountability-hub/create">
          <Button>Create Your First Group</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-dashboard p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Accountability Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group Name: {group.name} • Active Cycle:{" "}
            {activeCycle
              ? `${format(new Date(activeCycle.startDate), "MMM d")} – ${format(
                  new Date(activeCycle.endDate),
                  "MMM d, yyyy"
                )}`
              : "No active cycle"}
          </p>
        </div>

        {/* Banner and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <Card className="overflow-hidden rounded-3xl">
            <div className="relative aspect-[21/9] w-full overflow-hidden">
              <Image
                src="/accountablity.png"
                alt="Accountability group banner"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed items={activityItems} />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <JPCard value={group._count.members} label="Total Members" />
          <JPCard value={0} label="Goals in Progress" />
        </div>

        {/* Quick Actions */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Start New Cycle</Button>
            <Link href={`/dashboard/accountability-hub?groupId=${group.id}`}>
              <Button variant="outline">View Members</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-40 rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-ring"
              placeholder="Write quick group notes..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 md:p-8 animate-pulse">
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <Skeleton className="rounded-3xl aspect-[21/9]" />
      <Skeleton className="rounded-3xl h-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </div>
    <Skeleton className="h-40 rounded-3xl" />
  </div>
);
