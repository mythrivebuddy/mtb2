"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSWRConfig } from "swr";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import JPCard from "@/components/dashboard/JPCard";
import ActivityFeed from "@/components/accountability/ActivityFeed";
import useAccountabilityFeed from "@/hooks/useAccountabilityFeed";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

type Member = {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    email?: string | null;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AccountabilityHubHome() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams?.get("groupId") ?? undefined;

  const {
    data: groups,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => fetcher(`/api/accountability-hub/groups?groupId=${groupId}`),
    enabled: !!groupId,
  });

  const group = groups;
  const activeCycle = group?.cycles?.[0];
  const {
    items: activityItems,
    isLoading: activityLoading,
    broadcastCycleUpdate,
    refetch: refetchFeed,
  } = useAccountabilityFeed(groupId);

  const isAdmin = group?.members?.some(
    (m: { userId: string; role: string }) =>
      m.userId === session?.user?.id && m.role?.toLowerCase() === "admin"
  );

  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCompletingCycle, setIsCompletingCycle] = useState(false);
  // 🧠 Remove members state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  useEffect(() => {
    setIsCompletingCycle(false);
  }, []);
  useEffect(() => {
    if (activeCycle) {
      const isExpired = new Date() > new Date(activeCycle.endDate);
      const isActive = activeCycle.status === "active";

      if (isExpired && isActive) {
        router.push(
          `/dashboard/accountability-hub/cycle/${activeCycle.id}?groupId=${groupId}`
        );
      }
    }
  }, [activeCycle]);
  useEffect(() => {
    if (group?.notes) setNotes(group.notes);
  }, [group?.notes]);

  const isPrivate = group?.visibility === "PRIVATE";
  const canSeeNotes = !isPrivate || isAdmin;
  const { mutateAsync: startNewCycle, isPending: isCreatingCycle } =
    useMutation({
      mutationFn: async () => {
        if (!groupId) throw new Error("Missing group ID");
        const res = await axios.post(
          `/api/accountability-hub/groups/${groupId}/cycles`
        );
        return res.data;
      },
    });

  /** 🧾 Save Notes */
  const handleSaveNotes = async () => {
    if (!groupId) return;
    setIsSavingNotes(true);
    try {
      const response = await fetch(
        `/api/accountability-hub/groups/${groupId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to save notes.");

      toast.success("Notes saved successfully!");
      mutate(`/api/accountability-hub/groups?groupId=${groupId}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSavingNotes(false);
    }
  };
  const handleStartNewCycle = async () => {
    if (!groupId) return;
    try {
      await startNewCycle(); // ✅ uses React Query mutation

      toast.success("New cycle started! The group is ready for new goals.");

      await refetch(); // refetch group info
      broadcastCycleUpdate(); // trigger activity feed update
      refetchFeed();
      setNotes("");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : (err as Error).message;
      toast.error(message);
    }
  };

  /** 🚪 Leave Group */
  const handleGroupLeaveByUser = async () => {
    if (!groupId) return;
    setIsLeaving(true);
    try {
      const res = await axios.delete(
        `/api/accountability-hub/groups/${groupId}/leave`
      );
      if (res.data.success) {
        toast.success("You have successfully left the group.");
        router.push("/dashboard/accountability/home");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Failed to leave the group."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLeaving(false);
    }
  };

  /** ❌ Remove a Member */
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!groupId || !memberId) return;
    setRemovingMemberId(memberId);
    try {
      const res = await axios.delete(
        `/api/accountability-hub/groups/${groupId}/leave?userId=${memberId}`
        // api/accountability-hub/groups/[groupId]/leave/route.ts
      );
      const { success } = res.data;
      if (success) {
        toast.success(`${memberName} has been removed from the group.`);
        await refetch();
        setIsDialogOpen(false);
      } else {
        toast.error(res.data.message || "Failed to remove member.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to remove member.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setRemovingMemberId(null);
    }
  };

  /** Filter members */
  const filteredMembers =
    group?.members?.filter(
      (m: Member) =>
        m.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        m?.role?.toLowerCase() !== "admin"
    ) || [];
  if (isCompletingCycle) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] bg-dashboard p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">
            Cycle has ended
          </h2>
          <p className="text-muted-foreground">
            Updating status and redirecting you to the summary...
          </p>
        </div>
      </div>
    );
  }
  if (isLoading) return <LoadingSkeleton />;
  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load accountability hub.</p>
      </div>
    );

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-dashboard p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => router.push(`/dashboard/accountability/home`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Group Name: {group?.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            • Active Cycle:{" "}
            {activeCycle
              ? `${format(new Date(activeCycle.startDate), "MMM d")} – ${format(
                  new Date(activeCycle.endDate),
                  "MMM d, yyyy"
                )}`
              : "No active cycle"}
          </p>
        </div>

        {/* Banner + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Banner */}
          <Card className="overflow-hidden rounded-3xl h-auto">
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

          {/* Activity Feed */}
          <Card className="rounded-3xl min-h-[200px] max-h-[400px] flex flex-col">
            <CardHeader className="flex-shrink-0 border-b">
              <CardTitle className="text-lg">Activity Feed</CardTitle>
            </CardHeader>

            {/* Scrollable feed area */}
            <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <ActivityFeed items={activityItems} isLoading={activityLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <JPCard value={group?._count?.members} label="Total Members" />
          <JPCard
            value={group?.cycles[0]?._count?.goals || 0}
            label="Goals in Progress"
          />
        </div>

        {/* Actions */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href={`/dashboard/accountability-hub?groupId=${group?.id}`}>
              <Button variant="outline">View Members Table</Button>
            </Link>

            {/* Leave Group */}
            {group?.cycles[0]?.status === "repeat" && !isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    {isLeaving ? "Leaving..." : "Leave Group"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave this group? You’ll lose
                      access to its goals and activities.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGroupLeaveByUser}
                      disabled={isLeaving}
                      className={`bg-red-600 text-white hover:bg-red-700 focus:ring-red-700 ${isLeaving ? "cursor-not-allowed bg-red-700" : ""}`}
                    >
                      {isLeaving ? "Leaving..." : "Leave Group"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Remove Members (Admin Only) */}
            {group?.cycles[0]?.status === "repeat" && isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Remove Members</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Remove Members</DialogTitle>
                    <DialogDescription>
                      Search for a member and remove them from the group.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-3"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member: Member) => (
                        <div
                          key={member.userId}
                          className="flex justify-between items-center border rounded-lg p-2"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                member?.user?.image
                                  ? member.user.image
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      member?.user?.name?.charAt(0) || "User"
                                    )}&background=random&color=fff`
                              }
                              alt={member.user.name || "Member Avatar"}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <span>{member.user.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={removingMemberId === member.userId}
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                member.user.name
                              )
                            }
                          >
                            {removingMemberId === member.userId
                              ? "Removing..."
                              : "Remove"}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No members found.
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Group Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {group?.notes ? (
              canSeeNotes ? (
                <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-line">
                  {group.notes}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  These notes are private and only visible to the admin.
                </p>
              )
            ) : isAdmin ? (
              <>
                <Textarea
                  className="w-full h-40"
                  placeholder="Write quick group notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="mt-4"
                >
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No notes have been added to this group yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Admin Actions */}
        {isAdmin && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isCreatingCycle}>
                    {isCreatingCycle
                      ? "Starting New Cycle..."
                      : "Start New Cycle"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will complete the current cycle and start a new one.
                      All members will be able to set new goals. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartNewCycle}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/** Skeleton while loading */
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
