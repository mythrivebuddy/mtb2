"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use"; // Removed useSearchParam, it's not used
import {
  ArrowLeft,
  Trophy,
  Star,
  MessageSquare,
  Rocket,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Import for session management ---
import { useSession } from "next-auth/react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const DEFAULT_REWARD_AMOUNT = 100;

type Member = {
  id: string;
  user: { id: string; name: string | null };
  role: string;
};

export default function CycleReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId") || "";
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { width, height } = useWindowSize();

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [isRewarding, setIsRewarding] = useState(false);

  // --- State for dialog control ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | string>(
    DEFAULT_REWARD_AMOUNT
  );
  const [memberIdsToReward, setMemberIdsToReward] = useState<string[]>([]);

  // --- Destructure 'session' and 'update' function ---
  const { data: session, update: updateSession } = useSession();

  const {
    data: report,
    error,
    isLoading,
    mutate,
  } = useSWR(
    cycleId ? `/api/accountability-hub/cycles/${cycleId}/report` : null,
    fetcher
  );

  // --- MODIFIED: Added optional chaining here for safety ---
  const isAdmin = report?.cycle?.group?.members?.find(
    (m: Member) => m.role === "ADMIN" && m.user.id === session?.user?.id
  );

  const handleSelectMember = (id: string) => {
    setSelectedMembers((prev) => {
       const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setRewardAmount("");
      return;
    }
    if (/^[0-9]+$/.test(value)) {
      setRewardAmount(Number(value));
    }
  };

  const handleReward = async () => {
    const numericRewardAmount = Number(rewardAmount);

    if (memberIdsToReward?.length === 0) {
      toast.error("No members selected");
      return;
    }

    if (!numericRewardAmount || numericRewardAmount <= 0) {
      toast.error("Please enter a positive number of JoyPearls.");
      return;
    }

    setIsRewarding(true);
    try {
      const { data } = await axios.post(
        `/api/accountability-hub/cycles/${cycleId}/reward`,
        {
          memberIds: memberIdsToReward,
          amount: numericRewardAmount,
        }
      );

      toast.success(data.message);

      if (updateSession) {
        await updateSession();
      }

      setSelectedMembers(new Set());
      setMemberIdsToReward([]);
      setIsDialogOpen(false);
      setRewardAmount(DEFAULT_REWARD_AMOUNT);
      mutate();
    } catch (err) {
      let errorMessage = "Failed to send rewards.";
      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsRewarding(false);
    }
  };

  const handleStartNewCycle = async () => {
    if (!groupId) return;
    try {
      const response = await axios.post(
        `/api/accountability-hub/groups/${groupId}/cycles`
      );
      toast(response?.data?.message || "New cycle started successfully");
      mutate(`/api/accountability-hub/groups?groupId=${groupId}`);
      router.push(`/dashboard/accountability?groupId=${groupId}`);
    } catch (err) {
      toast((err as Error).message);
    }
  };

  const openRewardDialog = (memberIds: string[]) => {
    if (memberIds?.length === 0) {
      toast.error("Please select at least one member.");
      return;
    }
    setMemberIdsToReward(memberIds);
    setRewardAmount(DEFAULT_REWARD_AMOUNT);
    setIsDialogOpen(true);
  };

  const openRewardAllDialog = () => {
    // --- MODIFIED: Access 'members' from 'report' directly and safely ---
    const allRewardableMemberIds = report?.members
      ?.filter((m: Member) => m.id !== session?.user?.id)
      .map((m: Member) => m.id);

    // --- MODIFIED: Added safety check ---
    if (!allRewardableMemberIds || allRewardableMemberIds.length === 0) {
      toast.error("There are no other members in this group to reward.");
      return;
    }

    setSelectedMembers(new Set(allRewardableMemberIds));
    setMemberIdsToReward(allRewardableMemberIds);
    setRewardAmount(DEFAULT_REWARD_AMOUNT);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setRewardAmount(DEFAULT_REWARD_AMOUNT);
    }
    setIsDialogOpen(isOpen);
  };

  if (isLoading) return <ReportSkeleton />;
  if (error || !report)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load cycle report.
      </div>
    );

  // Destructuring is safe *after* the loading/error checks
  const { cycle, members, highlights, summary } = report;

  // --- MODIFIED: Added optional chaining for safety ---
  const rewardableMembers = members?.filter(
    (m: Member) => m.id !== session?.user?.id
  );
  const memberCount = rewardableMembers?.length || 0;

  const memberListContainerClasses = [
    "mb-4",
    "max-h-40",
    "overflow-y-auto",
    "pr-2",
    memberCount > 5
      ? "grid grid-cols-2 gap-x-4 gap-y-2"
      : "space-y-2",
  ].join(" ");

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={300}
      />

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reward Members</DialogTitle>
            <DialogDescription>
              How many JoyPearls 💎 do you want to reward{" "}
              {memberIdsToReward?.length}{" "}
              {memberIdsToReward?.length === 1 ? "member" : "members"}?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={rewardAmount}
                onChange={handleAmountChange}
                className="col-span-3"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isRewarding}
            >
              Cancel
            </Button>
            <Button onClick={handleReward} disabled={isRewarding}>
              {isRewarding ? "Sending..." : "Confirm Reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => router.push(`/dashboard/accountability/home`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Hub
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎉 Cycle Complete! 🎉
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {/* --- MODIFIED: Added checks and fallbacks to prevent crash --- */}
            Reviewing cycle from{" "}
            {cycle?.startDate
              ? format(new Date(cycle.startDate), "MMM d")
              : "..."}{" "}
            to{" "}
            {cycle?.endDate
              ? format(new Date(cycle.endDate), "MMM d, yyyy")
              : "..."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {/* --- MODIFIED: All cards now use optional chaining --- */}
          <GradientCard
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
            title="Cycle Summary"
          >
            <div className="text-xl font-semibold">
              {summary?.totalGoals || 0} Goals
            </div>
            <p className="text-gray-400 text-sm">
              {summary?.completionRate || 0}% completion rate
            </p>
          </GradientCard>

          <GradientCard
            icon={<Star className="w-6 h-6 text-blue-400" />}
            title="Most Active"
          >
            <div className="text-xl font-semibold">
              {highlights?.mostActive?.name || "N/A"}
            </div>
            <p className="text-gray-400 text-sm">
              {highlights?.mostActive?.updates || 0} progress updates
            </p>
          </GradientCard>

          <GradientCard
            icon={<MessageSquare className="w-6 h-6 text-pink-400" />}
            title="Most Supportive"
          >
            <div className="text-xl font-semibold">
              {highlights?.mostSupportive?.name || "N/A"}
            </div>
            <p className="text-gray-400 text-sm">
              {highlights?.mostSupportive?.comments || 0} comments given
            </p>
          </GradientCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isAdmin && (
            <Card className="p-6 shadow-sm border-gray-200 bg-gradient-to-br from-amber-50 to-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-800">Reward Members</h2>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Select members to reward with JoyPearls 💎
              </p>

              <div className={memberListContainerClasses}>
                {/* --- MODIFIED: Added optional chaining to map --- */}
                {rewardableMembers?.map((m: Member) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 border rounded-md hover:bg-amber-50"
                  >
                    <span className="text-sm">{m?.user?.name}</span>
                    <Checkbox
                      checked={selectedMembers.has(m.id)}
                      onCheckedChange={() => handleSelectMember(m.id)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => openRewardDialog(Array.from(selectedMembers))}
                  disabled={isRewarding || selectedMembers.size === 0}
                >
                  {isRewarding ? "..." : `Reward (${selectedMembers.size})`}
                </Button>
                <Button
                  variant="secondary"
                  onClick={openRewardAllDialog}
                  disabled={isRewarding}
                >
                  Reward All
                </Button>
              </div>
            </Card>
          )}

          {isAdmin && (
            <Card className="p-6 shadow-sm border-gray-200 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-800">Start New Cycle</h2>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Wrap up this cycle and launch the next one for your group.
              </p>
              <Button
                className="w-full"
                onClick={handleStartNewCycle}
              >
                Start New Cycle
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

/* Gradient card helper (unchanged) */
function GradientCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-gray-50 via-white to-gray-100 text-center">
      <div className="flex flex-col items-center space-y-2">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <div>{children}</div>
      </div>
    </Card>
  );
}

/* Skeleton loader (unchanged) */
function ReportSkeleton() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-6 animate-pulse space-y-6">
      <Skeleton className="h-8 w-1f-4 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}