"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import AddMemberModal from "@/components/accountability/AddMemberModal";

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
type MentionSuggestion = {
  id: string;
  display: string;
  image: string | null;
  isAll?: boolean;
};
type Cycle = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AccountabilityHubHome() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams?.get("groupId") ?? undefined;
  const [isEditingNotes, setIsEditingNotes] = useState(false);

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
  const activeCycle = group?.cycles?.find(
    (cycle: Cycle) => cycle.status === "active" || cycle.status === "repeat",
  );
  const {
    items: activityItems,
    isLoading: activityLoading,
    broadcastCycleUpdate,
    refetch: refetchFeed,
  } = useAccountabilityFeed(groupId);

  const isAdmin = group?.members?.some(
    (m: { userId: string; role: string }) =>
      m.userId === session?.user?.id && m.role?.toLowerCase() === "admin",
  );

  const isGroupBlocked = group?.isBlocked == true;

  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCompletingCycle, setIsCompletingCycle] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const [showAllMentionPopover, setShowAllMentionPopover] = useState(false);
  const [allMentionAnchor, setAllMentionAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setIsCompletingCycle(false);
  }, []);
  useEffect(() => {
    if (activeCycle) {
      const isExpired = new Date() > new Date(activeCycle.endDate);
      const isActive =
        activeCycle.status === "active" || activeCycle.status === "repeat";

      if (isExpired && isActive) {
        router.push(
          `/dashboard/accountability-hub/cycle/${activeCycle.id}?groupId=${groupId}`,
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
          `/api/accountability-hub/groups/${groupId}/cycles`,
        );
        return res.data;
      },
    });

  /** 🧾 Save Notes */
  const handleSaveNotes = async () => {
    if (!groupId) return;
    setIsSavingNotes(true);

    try {
      const { userIds, everyone } = extractMentions(notes);

      await axios.patch(`/api/accountability-hub/groups/${groupId}`, {
        notes,
        mentionedUserIds: everyone ? [] : userIds,
        everyone,
      });

      toast.success("Notes saved successfully!");
      await refetch();
      setIsEditingNotes(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSavingNotes(false);
    }
  };
  const handleStartNewCycle = async () => {
    if (!groupId) return;
    try {
      await startNewCycle(); //  uses React Query mutation

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
        `/api/accountability-hub/groups/${groupId}/leave`,
      );
      if (res.data.success) {
        toast.success("You have successfully left the group.");
        router.push("/dashboard/accountability/home");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Failed to leave the group.",
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
        `/api/accountability-hub/groups/${groupId}/leave?userId=${memberId}`,
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
  const extractMentions = (
    text: string,
  ): { userIds: string[]; everyone: boolean } => {
    const everyone = /@all\b/i.test(text);

    const userIds: string[] = [];

    allMembersData.forEach((member: MentionSuggestion) => {
      const escapedName = member.display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`@${escapedName}\\b`, "i");

      if (regex.test(text)) {
        userIds.push(member.id);
      }
    });

    return { userIds, everyone };
  };
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setNotes(text);

    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const query = textBeforeCursor.substring(atIndex + 1);
    if (/\s/.test(query) || /@/.test(query)) {
      setShowSuggestions(false);
      return;
    }

    setMentionQuery(query);
    setMentionStartIndex(atIndex);

    const filteredMembers: MentionSuggestion[] = allMembersData.filter(
      (member: MentionSuggestion) =>
        member.display.toLowerCase().includes(query.toLowerCase()),
    );

    // Add @all option
    const allOption: MentionSuggestion[] = [
      { id: "all", display: "all", image: null, isAll: true },
    ];

    const filtered = [...allOption, ...filteredMembers];

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setActiveSuggestionIndex(0);
  };

  const handleSuggestionClick = (suggestion: MentionSuggestion) => {
    if (mentionStartIndex === -1) return;

    const mentionText = `@${suggestion.display} `;
    const part1 = notes.substring(0, mentionStartIndex);
    const part2 = notes.substring(mentionStartIndex + mentionQuery.length + 1);

    const newText = part1 + mentionText + part2;
    setNotes(newText);

    setShowSuggestions(false);
    setMentionQuery("");
    setMentionStartIndex(-1);
    setActiveSuggestionIndex(0);
    setTimeout(() => {
      const newCursorPos = part1.length + mentionText.length;
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  /** Filter members */
  const filteredMembers =
    group?.members?.filter(
      (m: Member) =>
        m.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        m?.role?.toLowerCase() !== "admin",
    ) || [];

  const allMembersData =
    group?.members?.map((member: Member) => ({
      id: member.user.id,
      display: member.user.name || "User",
      image: member.user.image,
    })) || [];

  // Change the function signature to accept members
  const renderNoteContent = (
    content: string,
    members: MentionSuggestion[] = allMembersData,
  ) => {
    if (!content) return null;

    const names = members
      .map((m: MentionSuggestion) => m.display)
      .filter(Boolean)
      .sort((a: string, b: string) => b.length - a.length);

    if (names.length === 0) return content;

    const escapedNames = names.map((name: string) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );

    const mentionRegex = new RegExp(`@(all|${escapedNames.join("|")})`, "gi");
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 0) return part;

      if (part.toLowerCase() === "all") {
        return (
          <span
            key={`all-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setAllMentionAnchor({
                x: rect.left,
                y: rect.bottom + window.scrollY,
              });
              setShowAllMentionPopover(true);
            }}
            className="text-blue-600 bg-blue-100 px-1 rounded-sm font-semibold hover:bg-blue-200 cursor-pointer"
          >
            @all
          </span>
        );
      }
      const member = members.find((m: MentionSuggestion) => m.display === part);

      if (member && groupId) {
        return (
          <Link
            href={`/dashboard/accountability-hub/member/${member.id}?groupId=${groupId}`}
            target="_blank"
            key={`${member.id}-${index}`}
            className="text-blue-600 bg-blue-100 px-1 rounded-sm font-semibold hover:bg-blue-200"
          >
            @{part}
          </Link>
        );
      }

      return `@${part}`;
    });
  };

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
          onClick={() => router.push("/dashboard/accountability/home")}
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
          {group.description && (
            <p className="text-md text-muted-foreground mt-1">
              Description:{group?.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            • Active Cycle:{" "}
            {activeCycle
              ? `${format(new Date(activeCycle.startDate), "MMM d")} – ${format(
                  new Date(activeCycle.endDate),
                  "MMM d, yyyy",
                )}`
              : "No active cycle"}
          </p>
        </div>
        {/* ✅ GROUP BLOCKED WARNING */}
        {isGroupBlocked && (
          <div className="p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 font-semibold text-center">
            🚫 This group has been blocked by the platform admin. It is now
            view-only, and no actions are allowed.
          </div>
        )}

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
          <Card className="rounded-3xl min-h-[200px] max-h-[400px] flex flex-col ">
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
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Link href={`/dashboard/accountability-hub?groupId=${group?.id}`}>
              <Button variant="outline" className="w-full">
                View Members Table
              </Button>
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

            {/*Add Members and  Remove Members (Admin Only) */}
            {(isAdmin || session?.user?.role === "ADMIN") && (
              <>
                <Button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  disabled={isGroupBlocked}
                  className={`bg-blue-600 hover:bg-blue-700 ${isGroupBlocked ? "hover:cursor-not-allowed opacity-75" : ""}`}
                >
                  Add Member
                </Button>
                <AddMemberModal
                  groupId={group.id}
                  isOpen={isAddMemberModalOpen}
                  onOpenChange={setIsAddMemberModalOpen}
                  refetch={refetch}
                />
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isGroupBlocked}
                      className={`${isGroupBlocked ? "opacity-75" : ""}`}
                    >
                      Remove Members
                    </Button>
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
                                        member?.user?.name?.charAt(0) || "User",
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
                                  member.user.name,
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">
              Group Notes & Notifications
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              (All the members will receive email and push notifications, you
              can use @all or @ to mention/tag a person)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {group?.notes && !isEditingNotes && (
              <>
                {canSeeNotes ? (
                  <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-line mb-4">
                    {renderNoteContent(group.notes, allMembersData)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    These notes are private and only visible to the admin.
                  </p>
                )}

                {isAdmin && (
                  <Button
                    onClick={() => setIsEditingNotes(true)}
                    disabled={isGroupBlocked}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Edit Notes
                  </Button>
                )}
              </>
            )}

            {isAdmin && (isEditingNotes || !group?.notes) && (
              <>
                <div className="relative">
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 max-h-60 overflow-y-auto rounded-md border bg-white shadow-md p-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(suggestion);
                          }}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          className={`flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded ${
                            index === activeSuggestionIndex ? "bg-gray-100" : ""
                          }`}
                        >
                          <img
                            src={
                              suggestion.image
                                ? suggestion.image
                                : `https://ui-avatars.com/api/?name=${suggestion.display}`
                            }
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="font-medium">
                            {suggestion.display}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Textarea
                    ref={textareaRef}
                    className="w-full h-40"
                    placeholder="Write notes... Use @ to mention"
                    value={notes}
                    onChange={handleNotesChange}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || isGroupBlocked}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </Button>

                  {group?.notes && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotes(group.notes);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}

            {!group?.notes && !isAdmin && (
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
                  <Button
                    disabled={isCreatingCycle || isGroupBlocked}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
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
      {/* @all mention popover */}
      {showAllMentionPopover && allMentionAnchor && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAllMentionPopover(false)}
          />
          <div
            className="fixed z-50 bg-white border rounded-md shadow-md p-1 max-h-60 overflow-y-auto min-w-[180px]"
            style={{ top: allMentionAnchor.y + 4, left: allMentionAnchor.x }}
          >
            <p className="text-xs text-gray-400 px-2 py-1 font-medium">
              All members
            </p>
            {allMembersData.map((member: MentionSuggestion) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100"
              >
                <img
                  src={
                    member.image
                      ? member.image
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.display)}`
                  }
                  className="w-6 h-6 rounded-full"
                />
                <span>{member.display}</span>
              </div>
            ))}
          </div>
        </>
      )}
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
