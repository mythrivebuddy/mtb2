// app/(userDashboard)/dashboard/accountability-hub/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import AddMemberModal from "@/components/accountability/AddMemberModal";
import EditableProgressCell from "@/components/accountability/EditableProgressCell";
import GoalStatusUpdater from "@/components/accountability/GoalStatusUpdater";
import CommentsModal from "@/components/accountability/CommentsModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Updated type definition
type GroupViewData = {
  name: string;
  activeCycleId: string;
  requesterRole: "admin" | "member";
  members: {
    id: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    goals: {
      id: string;
      text: string;
      midwayUpdate: string | null;
      endResult: string | null;
      status: "on_track" | "needs_attention" | "off_track";
    }[];
  }[];
};

export default function AccountabilityHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");
  const { data: session } = useSession();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [commentsGoalId, setCommentsGoalId] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR<GroupViewData>(
    groupId ? `/api/accountability-hub/groups/${groupId}/view` : null,
    fetcher
  );

  const groupName = data?.name;
  const activeCycleId = data?.activeCycleId;
  const members = data?.members;
  const isAdmin = data?.requesterRole === "admin";

  const handleCommentClick = (goalId: string | undefined) => {
    if (goalId) {
      setCommentsGoalId(goalId);
    } else {
      // You can add a toast here to inform the user
      console.log("A goal must be set before commenting.");
    }
  };

  if (!groupId) {
    return (
      <div className="text-center p-10">
        <p className="text-muted-foreground">No group selected.</p>
        <Button variant="link" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl py-8 px-4">
      {/* Modals */}
      {groupId && (
        <AddMemberModal
          groupId={groupId}
          isOpen={isAddMemberModalOpen}
          onOpenChange={setIsAddMemberModalOpen}
        />
      )}
      <CommentsModal
        goalId={commentsGoalId}
        isOpen={!!commentsGoalId}
        onOpenChange={() => setCommentsGoalId(null)}
      />

      {/* Navigation and Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="flex w-full items-center justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-48" /> : groupName}
          </h1>
          <p className="text-muted-foreground">
            Track and motivate your solopreneur communitys  monthly goals.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accountability-hub/create">
            <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition">
              <PlusCircle size={24} />
              <span className="font-semibold hidden sm:inline">Create</span>
            </button>
          </Link>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddMemberModalOpen(true)}
          >
            Add Member
          </Button>
        </div>
      </div>

      <Input type="text" placeholder="Search members" className="w-full mb-6" />

      {/* Members Table */}
      <div className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Member</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Midway update</TableHead>
              <TableHead>End Result</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-red-500">
                  Failed to load members.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && members?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No members found in this group yet.
                </TableCell>
              </TableRow>
            )}
            {members?.map((member) => {
              const goal = member.goals?.[0];
              const isCurrentUser = member.user.id === session?.user?.id;
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={member.user.image || "/default-avatar.png"}
                        alt={member.user.name || "User"}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                      />
                      <Link href={`/dashboard/accountability-hub/member/${member.id}?groupId=${groupId}`} className="font-medium hover:underline">
                        {member.user.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activeCycleId && (
                      <EditableProgressCell
                        initialValue={goal?.text}
                        groupId={groupId!}
                        cycleId={activeCycleId}
                        fieldToUpdate="text"
                        isCurrentUser={isCurrentUser}
                        placeholderText="Click to set goal"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {activeCycleId && (
                      <EditableProgressCell
                        initialValue={goal?.midwayUpdate}
                        groupId={groupId!}
                        cycleId={activeCycleId}
                        fieldToUpdate="midwayUpdate"
                        isCurrentUser={isCurrentUser}
                        placeholderText="Set midway update"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {activeCycleId && (
                      <EditableProgressCell
                        initialValue={goal?.endResult}
                        groupId={groupId!}
                        cycleId={activeCycleId}
                        fieldToUpdate="endResult"
                        isCurrentUser={isCurrentUser}
                        placeholderText="Set end result"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {goal && activeCycleId ? (
                      <GoalStatusUpdater
                        goalId={goal.id}
                        groupId={groupId!}
                        cycleId={activeCycleId}
                        currentStatus={goal.status}
                        isAdmin={isAdmin}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" onClick={() => handleCommentClick(goal?.id)}>
                      Comment
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell className="text-right">
      <Skeleton className="h-8 w-20 ml-auto" />
    </TableCell>
  </TableRow>
);