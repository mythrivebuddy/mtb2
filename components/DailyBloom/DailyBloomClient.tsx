/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Loader2,
  EyeIcon,
  Calendar as CalendarIcon,
  FileText,
  Repeat,
  BookOpen,
  Pencil,
  PlusCircle,
  ListChecks,
} from "lucide-react";
import axios from "axios";

import { dailyBloomSchema, DailyBloomFormType } from "@/schema/zodSchema";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";

import CustomAccordion from "@/components/dashboard/user/ CustomAccordion";
import PageSkeleton from "../PageSkeleton";
import { getAxiosErrorMessage } from "@/utils/ax";
import { toast } from "sonner";

const defaultFormValues: DailyBloomFormType = {
  title: "",
  description: "",
  frequency: "Daily",
  dueDate: new Date(),
  isCompleted: false,
  taskAddJP: false,
  taskCompleteJP: false,
};

export default function DailyBloomClient() {
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState<any>(null);
  const [viewData, setViewData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addData, setAddData] = useState<boolean>(false);
  const [frequencyFilter, setFrequencyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DailyBloomFormType>({
    resolver: zodResolver(dailyBloomSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (editData) {
      reset({
        title: editData.title || "",
        description: editData.description || "",
        frequency: editData.frequency || "Daily",
        dueDate: editData.dueDate ? new Date(editData.dueDate) : new Date(),
      });
    }
  }, [editData, reset]);

  useEffect(() => {
    if (addData) {
      reset(defaultFormValues);
    }
  }, [addData, reset]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [frequencyFilter, statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["dailyBloom", frequencyFilter, statusFilter, currentPage],
    queryFn: async () => {
      const res = await axios.get(
        `/api/user/daily-bloom?frequency=${frequencyFilter}&status=${statusFilter}&page=${currentPage}&limit=${itemsPerPage}`
      );
      return res.data;
    },
    
  });

  const dailyBloom = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const createMutation = useMutation({
    mutationFn: async (data: DailyBloomFormType) => {
      const res = await axios.post("/api/user/daily-bloom", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
      toast.success("Daily Bloom created successfully!");
      setAddData(false);
    },
    onError: (error) => {
      const errorMessage = getAxiosErrorMessage(
        error,
        "An error occurred while creating Daily Bloom."
      );
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      updatedData: DailyBloomFormType;
    }) => {
      const res = await axios.put(
        `/api/user/daily-bloom/${data.id}`,
        data.updatedData
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
    },
    onError: () => {
      toast.error("Failed to update task.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/user/daily-bloom/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  const onSubmit = (data: DailyBloomFormType) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: DailyBloomFormType) => {
    if (editData) {
      updateMutation.mutate(
        { id: editData.id, updatedData: data },
        {
          onSuccess: () => {
            toast.success("Updated successfully");
            queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
            setEditData(null);
          },
        }
      );
    }
  };

  const handleCloseEditModal = () => {
    setEditData(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <style>{`
        .group:hover .group-hover-content {
          display: block;
        }
      `}</style>
      <CustomAccordion />
      <div className="container mx-auto p-3 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <div className="space-y-3">
              <CardTitle>Daily Blooms</CardTitle>
              <CardDescription>
                Let your goals bloom by planting the seeds of daily action.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setAddData(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Daily Bloom
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <PageSkeleton type="leaderboard" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Daily Blooms</CardTitle>
              <div className="flex items-center justify-between mt-2">
                <CardDescription className="w-full">
                  Overview of your tracked blooms
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-36 justify-between"
                    >
                      <span>{statusFilter}</span>
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="group-hover-content hidden absolute z-10 w-full bg-background border rounded-md shadow-lg p-1 top-full">
                      <Button
                        type="button"
                        variant={statusFilter === 'Pending' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setStatusFilter('Pending')}
                      >
                        Pending
                      </Button>
                      <Button
                        type="button"
                        variant={statusFilter === 'Completed' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setStatusFilter('Completed')}
                      >
                        Completed
                      </Button>
                    </div>
                  </div>
                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-36 justify-between"
                    >
                      <span>{frequencyFilter}</span>
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="group-hover-content hidden absolute z-10 w-full bg-background border rounded-md shadow-lg p-1 top-full">
                      <Button
                        type="button"
                        variant={frequencyFilter === 'All' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter('All')}
                      >
                        All
                      </Button>
                      <Button
                        type="button"
                        variant={frequencyFilter === 'Daily' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter('Daily')}
                      >
                        Daily
                      </Button>
                      <Button
                        type="button"
                        variant={frequencyFilter === 'Weekly' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter('Weekly')}
                      >
                        Weekly
                      </Button>
                      <Button
                        type="button"
                        variant={frequencyFilter === 'Monthly' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter('Monthly')}
                      >
                        Monthly
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dailyBloom.length === 0 ? (
                 <div className="py-10 text-center">
                    <p className="text-muted-foreground">
                      No blooms Available.
                    </p>
                  </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-center">Achieve</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyBloom.map((bloom: any) => {
                    const dueDate = bloom.dueDate
                      ? new Date(bloom.dueDate).toLocaleDateString("en-IN")
                      : "-";

                    return (
                      <TableRow key={bloom.id}>
                        <TableCell className="text-center">
                          <Input
                            type="checkbox"
                            checked={bloom.isCompleted}
                            onChange={(e) => {
                              updateMutation.mutate(
                                {
                                  id: bloom.id,
                                  updatedData: {
                                    ...bloom,
                                    isCompleted: e.target.checked,
                                  },
                                },
                                {
                                  onSuccess: () => {
                                    toast.success(`Task marked as ${!e.target.checked ? "complete" : "pending"}.`);
                                    queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
                                  },
                                }
                              );
                            }}
                            className="w-4 h-4 rounded-md checkbox-round mx-auto border-gray-300 text-black focus:ring-2 focus:ring-black/65 transition duration-200 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {bloom.title.length > 10
                            ? `${bloom.title.slice(0, 10)}...`
                            : bloom.title}
                        </TableCell>
                        <TableCell>
                          {bloom.description && bloom.description.length > 10
                            ? `${bloom.description.slice(0, 10)}...`
                            : bloom.description || "-"}
                        </TableCell>
                        <TableCell>{dueDate}</TableCell>
                        <TableCell>{bloom.frequency}</TableCell>
                        <TableCell className="text-center space-x-3">
                          <button onClick={() => setViewData(bloom)}>
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditData(bloom)}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(bloom.id)}>
                            <Trash2 className="w-4 h-4 " />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              )}
            </CardContent>
            <div className="flex items-center justify-center space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Next
                </Button>
            </div>
          </Card>
        )}

        {/* View Modal */}
        <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Bloom Details</DialogTitle>
              <DialogDescription>
                A detailed view of your selected daily bloom.
              </DialogDescription>
            </DialogHeader>
            {viewData && (
              <div className="grid gap-6 py-4">
                <div className="flex items-start gap-4">
                  <FileText className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Title
                    </p>
                    <p className="text-base font-semibold">{viewData.title}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p className="text-base text-gray-700">
                      {viewData.description || (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Due Date
                    </p>
                    <p className="text-base">
                      {viewData.dueDate ? (
                        new Date(viewData.dueDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Repeat className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Frequency
                    </p>
                    <p className="text-base">{viewData.frequency}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewData(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog
          open={!!editData}
          onOpenChange={(isOpen) => !isOpen && handleCloseEditModal()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Daily Bloom</DialogTitle>
              <DialogDescription>
                Make changes to your daily bloom here. Click update when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onUpdate)}>
              <div className="grid gap-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="title-edit">Title</Label>
                  <Input id="title-edit" {...register("title")} placeholder="Title" />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="desc-edit">Description</Label>
                  <Textarea
                    id="desc-edit"
                    {...register("description")}
                    placeholder="Description (max 500 characters)"
                    className="min-h-[120px] resize-y"
                  />
                   {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                </div>
                <div className="flex items-end space-x-4">
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                       <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="date-edit">Due Date</Label>
                        <Input
                          id="date-edit"
                          type="date"
                          value={
                            field.value instanceof Date
                              ? field.value.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : undefined
                            );
                          }}
                        />
                         {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate.message}</p>}
                       </div>
                    )}
                  />
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => (
                      <div className="grid w-full items-center gap-1.5">
                        <Label>Frequency</Label>
                        <div className="relative group">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span>{field.value}</span>
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <div className="group-hover-content hidden absolute z-10 w-full bg-background border rounded-md shadow-lg p-1 top-full">
                             <Button
                                type="button"
                                variant={field.value === 'Daily' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => field.onChange('Daily')}
                              >
                                Daily
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === 'Weekly' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => field.onChange('Weekly')}
                              >
                                Weekly
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === 'Monthly' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => field.onChange('Monthly')}
                              >
                                Monthly
                              </Button>
                          </div>
                        </div>
                        {errors.frequency && <p className="text-sm text-red-500">{errors.frequency.message}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditModal}
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

        {/* Add Task Modal */}
        <Dialog open={addData} onOpenChange={setAddData}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Your Bloom</DialogTitle>
             
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="title-add">Title</Label>
                  <Input
                    id="title-add"
                    {...register("title")}
                    placeholder="e.g., Read a chapter"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="desc-add">Description</Label>
                  <Textarea
                    id="desc-add"
                    {...register("description")}
                    placeholder="(Optional) Add more details..."
                  />
                   {errors.description && (
                    <p className="text-red-500 text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex items-end space-x-4">
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="date-add">Due Date</Label>
                        <Input
                          id="date-add"
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                        />
                         {errors.dueDate && (
                            <p className="text-red-500 text-sm">
                              {errors.dueDate.message}
                            </p>
                          )}
                      </div>
                    )}
                  />
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => (
                      <div className="grid w-full items-center gap-1.5">
                        <Label>Frequency</Label>
                        <div className="relative group">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span>{field.value}</span>
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <div className="group-hover-content hidden absolute z-10 w-full bg-background border rounded-md shadow-lg p-1 top-full">
                               <Button
                                  type="button"
                                  variant={field.value === 'Daily' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => field.onChange('Daily')}
                                >
                                  Daily
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === 'Weekly' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => field.onChange('Weekly')}
                                >
                                  Weekly
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === 'Monthly' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => field.onChange('Monthly')}
                                >
                                  Monthly
                                </Button>
                            </div>
                        </div>
                         {errors.frequency && (
                            <p className="text-red-500 text-sm">
                              {errors.frequency.message}
                            </p>
                          )}
                      </div>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddData(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete this
                daily bloom and remove its data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
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
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
