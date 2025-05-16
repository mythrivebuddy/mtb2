"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/notification-bell";
import MyRequests from "@/components/buddy-lens/MyRequests";
import RequestsToReview from "@/components/buddy-lens/AvailableRequest";
import ReviewedRequests from "@/components/buddy-lens/ReviewedRequests";
import PageLoader from "@/components/PageLoader";

export default function BuddyLensDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [tabValue, setTabValue] = useState<
    "my-requests" | "to-review" | "reviewed"
  >("my-requests");

  if (!userId) {
    return (
      <PageLoader />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Buddy Lens</h2>
          <NotificationBell />
        </div>
        <Tabs
          value={tabValue}
          onValueChange={(value) =>
            setTabValue(value as "my-requests" | "to-review" | "reviewed")
          }
          className="w-full"
        >
          <TabsList className="mb-4  grid w-full grid-cols-3">
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="to-review">Available Request</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="my-requests">
            <MyRequests userId={userId} />
          </TabsContent>
          <TabsContent value="to-review">
            <RequestsToReview userId={userId} />
          </TabsContent>
          <TabsContent value="reviewed">
            <ReviewedRequests userId={userId} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
