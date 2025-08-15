"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Eye, Loader2, Info, AlertTriangle } from "lucide-react";
import { miracleLogSchema, type MiracleLogFormType } from "@/schema/zodSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import { getAxiosErrorMessage } from "@/utils/ax";
import { startOfDay, endOfDay } from "date-fns";
import CustomAccordion from "@/components/dashboard/user/ CustomAccordion";
import PageSkeleton from "../PageSkeleton";
import { MiracleLog, MiracleLogClientProps } from "@/types/client/mericle-lo";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";

// --- START: useMediaQuery Hook ---
// This custom hook helps determine the screen size for responsive rendering.
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      window.addEventListener("resize", listener);
      return () => window.removeEventListener("resize", listener);
    }
  }, [matches, query]);

  return matches;
};
// --- END: useMediaQuery Hook ---

export default function MiracleLogClient({}: MiracleLogClientProps) {
  const [editingLog, setEditingLog] = useState<MiracleLog | null>(null);
  const [viewLog, setViewLog] = useState<MiracleLog | null>(null);
  const [deleteLog, setDeleteLog] = useState<MiracleLog | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [todayEntriesCount, setTodayEntriesCount] = useState(0);

  // --- START: Responsive State ---
  // Check for mobile view (screens less than 768px wide)
  const isMobile = useMediaQuery("(max-width: 768px)");
  // --- END: Responsive State ---

  const queryClient = useQueryClient();

  const {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MiracleLogFormType>({
    resolver: zodResolver(miracleLogSchema),
    defaultValues: {
      content: "",
    },
  });

  useOnlineUserLeaderBoard();

  useEffect(() => {
    console.log("error", errors);
  }, [errors]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["miracleLogs"],
    queryFn: async () => {
      const res = await axios.get("/api/user/miracle-log");
      return res.data;
    },
  });

  const { data: streak = { count: 0 } } = useQuery({
    queryKey: ["streak", "MIRACLE_LOG"],
    queryFn: async () => {
      const res = await axios.get("/api/streak?type=MIRACLE_LOG");
      return res.data;
    },
  });

  useEffect(() => {
    if (logs.length > 0) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const todayLogs = logs.filter((log: MiracleLog) => {
        const logDate = new Date(log.createdAt);
        return logDate >= startOfToday && logDate <= endOfToday;
      });

      setTodayEntriesCount(todayLogs.length);
    }
  }, [logs]);

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await axios.post("/api/user/miracle-log", { content });
      await axios.post("/api/streak", { type: "MIRACLE_LOG" });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miracleLogs"] });
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      queryClient.invalidateQueries({ queryKey: ["streak", "MIRACLE_LOG"] });
      reset();
      toast.success("Log created successfully");
    },
    onError: (error) => {
      const errorMessage = getAxiosErrorMessage(error, "An error occurred");
      if (errorMessage.includes("Daily limit of 3 entries reached")) {
        toast.error(
          "You've reached the daily limit of 3 entries. Please try again tomorrow."
        );
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await axios.put(`/api/user/miracle-log/${id}`, { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miracleLogs"] });
      setEditingLog(null);
      setUpdateDialogOpen(false);
      reset();
      toast.success("Log updated successfully");
    },
    onError: () => {
      toast.error("Failed to update log");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/user/miracle-log/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miracleLogs"] });
      toast.success("Log deleted successfully");
      setDeleteLog(null);
    },
    onError: () => {
      toast.error("Failed to delete log");
      setDeleteLog(null);
    },
  });

  const onSubmit = (data: MiracleLogFormType) => {
    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, content: data.content });
    } else {
      createMutation.mutate(data.content);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteLog) {
      deleteMutation.mutate(deleteLog.id);
    }
  };

  return (
    <div className="min-h-screen xl:mx-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 ">
      <CustomAccordion />
      <div className="max-w-4xl mx-auto max-lg:px-4 space-y-8">
        <Card className="relative bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100">
          {/* 🔥 Streak Count - Top Right */}
          <div className="absolute top-4 right-4 flex items-center gap-1 text-orange-500 font-bold text-sm animate-pulse">
            🔥 {streak.count === 0 ? "Day 0" : `${streak.count} day streak`}
          </div>

          <CardHeader>
            <div className="space-y-2">
              <CardTitle>Miracle Log</CardTitle>
              <CardDescription>
                Record your daily miracles and positive moments
              </CardDescription>

              <div className="text-sm text-muted-foreground mt-2">
                {streak.count === 0 ? (
                  <span>
                    Your streak is broken. Start again to build your streak!
                  </span>
                ) : streak.count >= 90 ? (
                  <span>
                    You have completed the 90-day streak! No more rewards, but
                    keep logging for your growth ✨
                  </span>
                ) : (
                  <span>Keep it up! Consistency builds miracles ✨</span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info Box */}
            {todayEntriesCount >= 3 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  You have reached the daily limit of 3 entries. Please try
                  again tomorrow.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  You can add up to 3 entries per day ({todayEntriesCount}/3
                  used today)
                </p>
              </div>
            )}

            {/* Miracle Log Input */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="relative">
                <Input
                  {...register("content")}
                  placeholder="Share a small miracle today (max 120 characters)"
                  maxLength={120}
                  disabled={
                    isSubmitting ||
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    todayEntriesCount >= 3
                  }
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1 absolute -bottom-6 left-0">
                    {errors.content.message}
                  </p>
                )}
              </div>

              {/* 🔒 Privacy Info */}
              <p className="text-xs text-muted-foreground mt-2">
                🔒 The log entries are not publicly visible
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    todayEntriesCount >= 3
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingLog ? "Update" : "Save"}
                </Button>
                {editingLog && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingLog(null);
                      setUpdateDialogOpen(false);
                      reset();
                    }}
                    disabled={isSubmitting || updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <PageSkeleton type="miracle-log" />
        ) : logs.length === 0 ? (
          <Card className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                No miracle logs yet. Start by adding your first entry above!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100">
            <CardHeader>
              <CardTitle>Your Miracle Logs</CardTitle>
              <CardDescription>
                View, edit, or delete your miracle logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* --- START: Responsive Layout Logic --- */}
              {isMobile ? (
                // --- MOBILE: Card View ---
                <div className="space-y-4">
                  {logs.map((log: MiracleLog) => {
                    const date = new Date(log.createdAt);
                    return (
                      <Card key={log.id} className="p-4">
                        <div className="flex flex-col space-y-3">
                          <p className="text-sm text-gray-800 break-words">
                            {log.content}
                          </p>
                          <div className="flex flex-col text-xs text-gray-500 border-t pt-3">
                            <span className="font-medium">
                              {date.toLocaleDateString("en-US", {
                                weekday: "long",
                              })}
                            </span>
                            <span>
                              {date.toLocaleDateString()} |{" "}
                              {date.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex gap-2 border-t pt-3">
                            <Button
                              className="p-2 h-auto bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-md transition-colors"
                              onClick={() => setViewLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              className="p-2 h-auto bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-md transition-colors"
                              onClick={() => {
                                setEditingLog(log);
                                setUpdateDialogOpen(true);
                                setValue("content", log.content);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              className="p-2 h-auto bg-red-100 text-red-800 hover:bg-red-200 rounded-md transition-colors"
                              onClick={() => setDeleteLog(log)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // --- DESKTOP: Table View ---
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Log</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: MiracleLog) => {
                      const date = new Date(log.createdAt);
                      const formattedDate = date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      const formattedTime = date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const formattedDay = date.toLocaleDateString("en-US", {
                        weekday: "long",
                      });

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.content.length > 100
                              ? `${log.content.slice(0, 100)}...`
                              : log.content}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {formattedDay}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formattedDate}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formattedTime}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewLog(log)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingLog(log);
                                  setUpdateDialogOpen(true);
                                  setValue("content", log.content);
                                }}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteLog(log)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {/* --- END: Responsive Layout Logic --- */}
            </CardContent>
          </Card>
        )}

        {/* View Modal */}
        <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Miracle Log Entry
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {viewLog && (
                <>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    {new Date(viewLog.createdAt).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {viewLog.content}
                  </p>
                </>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setViewLog(null)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={!!deleteLog} onOpenChange={() => setDeleteLog(null)}>
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="mt-4 text-xl font-semibold text-gray-800">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this entry? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <blockquote className="border-l-4 border-gray-200 pl-4 italic text-sm text-muted-foreground">
                {deleteLog?.content}
              </blockquote>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteLog(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog
          open={updateDialogOpen}
          onOpenChange={() => {
            setUpdateDialogOpen(false);
            setEditingLog(null);
            reset();
          }}
        >
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Update Your Miracle Log
              </DialogTitle>
              <DialogDescription>
                Make changes to your entry below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              <Input
                {...register("content")}
                defaultValue={editingLog?.content}
                className="mt-4"
                maxLength={120}
                disabled={updateMutation.isPending}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.content.message}
                </p>
              )}
              <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUpdateDialogOpen(false);
                    setEditingLog(null);
                    reset();
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
