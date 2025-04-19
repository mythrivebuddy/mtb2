"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import {
  progressvaultSchema,
  type progressVaultFormType,
} from "@/schema/zodSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface ProgressVault {
  id: string;
  content: string;
  createdAt: string;
}

export default function ProgressVaultPage() {
  const [editingLog, setEditingLog] = useState<ProgressVault | null>(null);
  const [viewLog, setViewLog] = useState<ProgressVault | null>(null);
  const [deleteLog, setDeleteLog] = useState<ProgressVault | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<progressVaultFormType>({
    resolver: zodResolver(progressvaultSchema),
    defaultValues: {
      content: "",
    },
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["progressvault"],
    queryFn: async () => {
      const res = await axios.get("/api/user/progress-vault");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await axios.post("/api/user/progress-vault", { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressvault"] });
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      reset();
      toast.success("Log created successfully");
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error, "An error occurred"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await axios.put(`/api/user/progress-vault/${id}`, {
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressvault"] });
      setEditingLog(null);
      setUpdateDialogOpen(false);
      toast.success("Log updated successfully");
    },
    onError: () => {
      toast.error("Failed to update log");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/user/progress-vault/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressvault"] });
      toast.success("Log deleted successfully");
      setDeleteLog(null);
    },
    onError: () => {
      toast.error("Failed to delete log");
      setDeleteLog(null);
    },
  });

  const onSubmit = (data: progressVaultFormType) => {
    createMutation.mutate(data.content);
  };

  const handleDeleteConfirm = () => {
    if (deleteLog) {
      deleteMutation.mutate(deleteLog.id);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog) {
      const content = (e.currentTarget as any).content.value;
      updateMutation.mutate({ id: editingLog.id, content });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Create Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Progress Vault</CardTitle>
          <CardDescription>Record your daily progress</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Input
                {...register("content")}
                placeholder="Share your progress vault today (max 120 characters)"
                disabled={isSubmitting || createMutation.isPending}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1 absolute -bottom-6 left-0">
                  {errors.content.message}
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-8">
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table Display */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your progress vault...</span>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No progress vault yet. Start by adding your first entry above!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress Vault</CardTitle>
            <CardDescription>View, edit, or delete your progress Vault</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ProgressVault</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: ProgressVault) => {
                  const date = new Date(log.createdAt);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.content.length > 100
                          ? `${log.content.slice(0, 100)}...`
                          : log.content}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {date.toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {date.toLocaleDateString()} |{" "}
                            {date.toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingLog(log);
                              setUpdateDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteLog(log)}
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
          </CardContent>
        </Card>
      )}

      {/* View Modal */}
      <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Progress Vault</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewLog && (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  {new Date(viewLog.createdAt).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <p className="whitespace-pre-wrap">{viewLog.content}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteLog} onOpenChange={() => setDeleteLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete this?
            <div className="italic text-sm text-muted-foreground mt-2">
              {deleteLog?.content}
            </div>
          </div>
          <DialogFooter>
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
              )}{" "}
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
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Your Progress Vault</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <Input
              name="content"
              defaultValue={editingLog?.content}
              className="mt-4"
              maxLength={120}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUpdateDialogOpen(false);
                  setEditingLog(null);
                }}
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
  );
}