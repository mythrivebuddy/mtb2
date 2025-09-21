// Home page 2
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JPCard from "@/components/dashboard/JPCard";
import ActivityFeed from "@/components/accountability/ActivityFeed";
import useAccountabilityFeed from "@/hooks/useAccountabilityFeed";
import Image from "next/image";
import Link from "next/link";

export default function AccountabilityHubHome() {
  // Mock data for first iteration. Later we will wire with APIs.
  const groupName = "September Goals";
  const cycleStart = useMemo(() => new Date(), []);
  const cycleEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 27);
    return d;
  }, []);

  const totalMembers = 25;
  const activeGoals = 18;

  // groupId will come from route/query later. Using a fixed id for first iteration
  const { items } = useAccountabilityFeed("demo-group");

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-dashboard p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Accountability Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group Name: {groupName} • Active Cycle: {format(cycleStart, "MMM d")} – {format(cycleEnd, "MMM d, yyyy")}
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
                className="object-cover object-[center_40%] scale-125"
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
              <ActivityFeed items={items} />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <JPCard value={totalMembers} label="Total Members" />
          <JPCard value={activeGoals} label="Goals in Progress" />
        </div>

        {/* Quick Actions */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Start New Cycle</Button>
            <Link href="/dashboard/accountability-hub">
            <Button variant="outline">View Members</Button>
            </Link>
            {/* Notes action moved to the Notes section below */}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-40 rounded-md border border-input bg-background p-3 text-sm focus:outline-none  focus:ring-ring"
              placeholder="Write quick group notes..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


