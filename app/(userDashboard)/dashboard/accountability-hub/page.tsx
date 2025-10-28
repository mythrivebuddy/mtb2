"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
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
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type GroupViewData = {
  name: string;
  group: {
    visibility: "PRIVATE" | "VISIBLE_TO_GROUP";
  };
  activeCycleId: string;
  requesterRole: "admin" | "member" | "ADMIN" | "MEMBER";
  members: {
    userId: string;
    role: "admin" | "member" | "ADMIN" | "MEMBER";
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
      authorId: string;
    }[];
  }[];
};

export default function AccountabilityHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const groupId = searchParams.get("groupId");
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [commentsGoalId, setCommentsGoalId] = useState<string | null>(null);
  const [editingGoalMemberId, setEditingGoalMemberId] = useState<string | null>(
    null
  );
  const [editingGoalValue, setEditingGoalValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ search state

  const {
    data,
    error,
    isLoading: groupDataLoading,
  } = useSWR<GroupViewData>(
    groupId ? `/api/accountability-hub/groups/${groupId}/view` : null,
    fetcher
  );

  const groupName = data?.name;
  const activeCycleId = data?.activeCycleId;
  const members = data?.members || [];

  const groupVisibility = data?.group?.visibility;
  const isAdmin = data?.requesterRole?.toLowerCase() === "admin";
  const isGroupPrivate = groupVisibility === "PRIVATE";

  const handleCommentClick = (goalId: string | undefined) => {
    if (goalId) setCommentsGoalId(goalId);
    else sonnerToast("No Comments allowed if no goal is set.");
  };

  const handleSave = async (cycleId: string, fieldToUpdate: "text") => {
    if (!groupId || !editingGoalValue.trim()) return;
    const value = editingGoalValue;

    setIsLoading(true);
    try {
      const response = await fetch("/api/accountability-hub/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          cycleId,
          field: fieldToUpdate,
          value,
        }),
      });

      if (!response.ok) throw new Error("Failed to save goal.");

      mutate(`/api/accountability-hub/groups/${groupId}/view`);
      toast({ title: "Goal saved successfully! 🎉" });
      setEditingGoalMemberId(null);
      setEditingGoalValue("");
    } catch (error) {
      toast({
        title: (error as Error).message || "Error saving goal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  // ✅ Filter members based on search term
  const filteredMembers = members.filter((member) =>
    member.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="mx-auto max-w-6xl py-8 px-4">
      {/* Modals */}
      {groupId && isAdmin && (
        <AddMemberModal
          groupId={groupId}
          isOpen={isAddMemberModalOpen}
          onOpenChange={setIsAddMemberModalOpen}
        />
      )}
      <CommentsModal
        goalId={commentsGoalId}
        members={members}
        groupId={groupId}
        isOpen={!!commentsGoalId}
        onOpenChange={() => setCommentsGoalId(null)}
      />

      {/* Header */}
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
            {groupDataLoading ? <Skeleton className="h-8 w-48" /> : groupName}
          </h1>
          <p className="text-muted-foreground">
            Track and motivate your solopreneur community’s monthly goals.
          </p>
        </div>

        {isAdmin && (
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
        )}
      </div>

      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search members..."
        className="w-full mb-6"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Members Table */}
      <div className="w-full border rounded-lg overflow-x-clip">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Member</TableHead>
              <TableHead className="min-w-[150px]">Goal</TableHead>
              <TableHead className="min-w-[150px]">Midway update</TableHead>
              <TableHead className="min-w-[150px]">End Result</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right min-w-[100px]">
                Comments
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {groupDataLoading && (
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

            {!groupDataLoading && !error && filteredMembers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  {searchTerm
                    ? "No members match your search."
                    : "No members found in this group yet."}
                </TableCell>
              </TableRow>
            )}

            {filteredMembers.map((member) => {
              const goal = member.goals?.[0];
              const isCurrentUser = member.user.id === session?.user?.id;
              const isEditingGoal = editingGoalMemberId === member.userId;
              const isGoalVisible = !isGroupPrivate || isAdmin || isCurrentUser;

              return (
                <TableRow key={member.userId}>
                  <TableCell className="relative overflow-hidden p-2">
                    {member.role?.toLowerCase() === "admin" && (
                      <div
                        className="absolute top-0 left-0 w-28 -translate-x-[2.7rem] translate-y-1 -rotate-45 bg-yellow-300 text-center text-[0.6rem] font-medium text-black shadow-md"
                        style={{ lineHeight: "1.25rem" }}
                      >
                        Coach
                      </div>
                    )}

                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            member?.user?.image
                              ? member.user.image
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  member?.user?.name?.charAt(0) || "User"
                                )}&background=random&color=fff`
                          }
                          alt={member?.user?.name || "User"}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/accountability-hub/member/${member.userId}?groupId=${groupId}`}
                          className="font-medium hover:underline"
                        >
                          {member.user.name}
                        </Link>
                      </div>
                    </div>
                  </TableCell>

                  {/* Goal Cell */}
                  <TableCell>
                    {activeCycleId && (
                      <>
                        {isEditingGoal ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                            <Input
                              value={editingGoalValue}
                              onChange={(e) =>
                                setEditingGoalValue(e.target.value)
                              }
                              placeholder="Enter your goal"
                              disabled={isLoading}
                              className="flex-grow min-w-[150px] w-full sm:w-auto"
                            />
                            <div className="flex justify-end sm:justify-start gap-2 flex-shrink-0">
                              <Button
                                onClick={() => handleSave(activeCycleId, "text")}
                                size="sm"
                                disabled={isLoading || !editingGoalValue.trim()}
                              >
                                {isLoading ? "..." : "Save"}
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingGoalMemberId(null);
                                  setEditingGoalValue("");
                                }}
                                size="sm"
                                variant="outline"
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              if (isCurrentUser) {
                                setEditingGoalMemberId(member.userId);
                                setEditingGoalValue(goal?.text || "");
                              }
                            }}
                            className={`p-2 rounded-md min-h-[40px] w-full ${
                              isCurrentUser
                                ? "cursor-pointer hover:bg-slate-50"
                                : ""
                            }`}
                          >
                            {(() => {
                              if (!isGoalVisible)
                                return (
                                  <span className="text-muted-foreground">
                                    Private to Coach and {member.user.name}
                                  </span>
                                );

                              if (goal?.text) return goal.text;
                              if (isCurrentUser)
                                return (
                                  <span className="text-muted-foreground">
                                    Click to set goal
                                  </span>
                                );
                              return (
                                <span className="text-muted-foreground">
                                  No goal set
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </TableCell>

                  {/* Midway Update Cell */}
                  <TableCell>
                    {activeCycleId && (
                      <EditableProgressCell
                        initialValue={goal?.midwayUpdate}
                        groupId={groupId!}
                        cycleId={activeCycleId}
                        fieldToUpdate="midwayUpdate"
                        isGoalPrivateToAdmin={"VISIBLE_TO_GROUP"} // Replace with actual value if needed
                        isCurrentUser={isCurrentUser}
                        placeholderText="Set midway update"
                      />
                    )}
                  </TableCell>

                  {/* End Result Cell */}
                  <TableCell>
                    {activeCycleId && (
                      <EditableProgressCell
                        initialValue={goal?.endResult}
                        groupId={groupId!}
                        cycleId={activeCycleId}
                        fieldToUpdate="endResult"
                        isGoalPrivateToAdmin={"VISIBLE_TO_GROUP"} // Replace with actual value if needed
                        isCurrentUser={isCurrentUser}
                        placeholderText="Set end result"
                      />
                    )}
                  </TableCell>

                  {/* Status Cell */}
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

                  {/* Comments Cell */}
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      onClick={() => handleCommentClick(goal?.id)}
                    >
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