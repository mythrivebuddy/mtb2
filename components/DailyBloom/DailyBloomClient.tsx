"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
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
  AlertTriangle,
} from "lucide-react";
import axios, { AxiosError } from "axios";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
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
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import PageSkeleton from "../PageSkeleton";
import { getAxiosErrorMessage } from "@/utils/ax";
import { toast } from "sonner";
import Overdue from "./Overdue";
import HoverDetails from "./HoverDetails";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import CustomAccordion from "../dashboard/user/ CustomAccordion";
import DailyBloomCalendar from "@/components/DailyBloomCalendar";

// Add this near your other imports at the top
import { type DailyBloom as CalendarBloom } from "@/types/client/daily-bloom";
// FIX: Define a specific type for extendedProps
interface CalendarEventExtendedProps {
  isBloom?: boolean;
  isCompleted?: boolean;
  description?: string;
  [key: string]: unknown; // Allows for other, unknown properties if necessary
}

// 1. DEFINE A TYPE FOR EVENTS
interface CalendarEvent {
  extendedProps: CalendarEventExtendedProps;
  id: string;
  title: string;
  start: string; // Keep as strings for FullCalendar
  end: string;
}

interface DailyBloom extends DailyBloomFormType {
  id: string;
  isFromEvent?: boolean; // NEW: true if this bloom was created from a Calendar Event
  createdAt?: string; // Add this line
  updatedAt?: string; // Optional property for updatedAt
  description: string | null; // Ensure description can be null
}
// Normalize API responses into this strict type
export interface ClientDailyBloom {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null; // always ISO string or null
  frequency?: "Daily" | "Weekly" | "Monthly" | null;
  createdAt?: string;
  updatedAt: string;
  taskAddJP: boolean;
  taskCompleteJP: boolean;
  isFromEvent?: boolean;
}
// Define the structure for a single page of blooms
interface DailyBloomPage {
  data: DailyBloom[];
  totalCount: number;
}

const defaultFormValues: DailyBloomFormType = {
  title: "",
  description: "",
  frequency: undefined,
  dueDate: new Date(),
  isCompleted: false,
  taskAddJP: false,
  taskCompleteJP: false,
};

// --- START: useMediaQuery Hook ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
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

export default function DailyBloomClient() {
  const today = new Date().toISOString().split("T")[0];
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [editData, setEditData] = useState<DailyBloom | null>(null);
  const [viewData, setViewData] = useState<DailyBloom | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addData, setAddData] = useState<boolean>(false);
  const [frequencyFilter, setFrequencyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const itemsPerPage = 8;
  const [addInputType, setAddInputType] = useState<"frequency" | "date">(
    "date"
  );
  const [hoveredBloomId, setHoveredBloomId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false); // New state for calendar dialog
  useOnlineUserLeaderBoard();

  const handleCreateBloomFromEvent = (payload: {
    title: string;
    description?: string;
    dueDate?: string;
  }) => {
    createMutation.mutate({
      title: payload.title,
      description: payload.description || "",
      dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(),
      isCompleted: false,
      isFromEvent: true,
      taskAddJP: false,
      taskCompleteJP: false,
    });
  };

  const { data: events } = useQuery<CalendarEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await axios.get("/api/events");
      return res.data;
    },
  });

  const isMobile = useMediaQuery("(max-width: 768px)");

  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<DailyBloomFormType>({
    resolver: zodResolver(dailyBloomSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (editData) {
      reset({
        title: editData.title || "",
        description: editData.description || "",
        frequency: editData.frequency || undefined,
        dueDate: editData.dueDate ? new Date(editData.dueDate) : undefined,
      });
    }
  }, [editData, reset]);

  useEffect(() => {
    if (addData) {
      setAddInputType("date");
      reset(defaultFormValues);
    }
  }, [addData, reset]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<{
      data: DailyBloom[];
      totalCount: number;
    }>({
      queryKey: ["dailyBloom", frequencyFilter, statusFilter],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await axios.get(
          `/api/user/daily-bloom?frequency=${frequencyFilter}&status=${statusFilter}&page=${pageParam}&limit=${itemsPerPage}`
        );
        return res.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const totalFetched = allPages.reduce(
          (acc, page) => acc + page.data.length,
          0
        );
        if (totalFetched < lastPage.totalCount) {
          return allPages.length + 1;
        }
        return undefined;
      },
    });

  const dailyBloom = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);
  console.log("Blooms data from API:", dailyBloom); // <-- ADD THIS

  const invalidateAllQueries = () => {
    if (!userId) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
    queryClient.invalidateQueries({ queryKey: ["overdueDailyBlooms"] });
    queryClient.invalidateQueries({ queryKey: ["user", userId] });
  };

  const createMutation = useMutation({
    mutationFn: async (newData: DailyBloomFormType) => {
      const { data } = await axios.post("/api/user/daily-bloom", newData);
      return data;
    },
    onMutate: async (newBloom) => {
      await queryClient.cancelQueries({
        queryKey: ["dailyBloom", frequencyFilter, statusFilter],
      });

      const previousBlooms = queryClient.getQueryData([
        "dailyBloom",
        frequencyFilter,
        statusFilter,
      ]);

      // 3. Optimistically update to the new value
      queryClient.setQueryData<InfiniteData<DailyBloomPage> | undefined>(
        ["dailyBloom", frequencyFilter, statusFilter],
        (oldData) => {
          // FIX: Ensure dueDate is a Date, not a string
          const optimisticBloom: DailyBloom = {
            ...newBloom,
            id: `temp-${Date.now()}`,
            dueDate: newBloom.dueDate
              ? new Date(newBloom.dueDate)
              : new Date(),
            createdAt: new Date().toISOString(),
            isCompleted: false,
            isFromEvent: true,
            updatedAt: new Date().toISOString(),
            description: newBloom.description ?? "",
          };

          if (!oldData || !oldData.pages) {
            return {
              pages: [{ data: [optimisticBloom], totalCount: 1 }],
              pageParams: [1],
            } as InfiniteData<DailyBloomPage>;
          }

          const newData = oldData.pages.map(
            (page: DailyBloomPage, index: number) => {
              if (index === 0) {
                return {
                  ...page,
                  data: [optimisticBloom, ...page.data],
                  totalCount: page.totalCount + 1,
                };
              }
              return page;
            }
          );

          return { ...oldData, pages: newData };
        }
      );

      return { previousBlooms };
    },
    onError: (err, newBloom, context) => {
      if (context?.previousBlooms) {
        queryClient.setQueryData(
          ["dailyBloom", frequencyFilter, statusFilter],
          context.previousBlooms
        );
      }
      const errorMessage = getAxiosErrorMessage(
        err,
        "An error occurred while creating Daily Bloom."
      );
      toast.error(errorMessage);
    },
    onSettled: () => {
      invalidateAllQueries();
      setAddData(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      updatedData: DailyBloomFormType;
    }) => {
      // This part stays the same - it's your API call
      const res = await axios.put(
        `/api/user/daily-bloom/${payload.id}`,
        payload.updatedData
      );
      return res.data;
    },

    // --- START: ADD THIS OPTIMISTIC UPDATE LOGIC ---

    // When mutate is called, this will run before the mutation function
    onMutate: async (newBloomData) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["dailyBlooms"] });

      // 2. Snapshot the previous value
      const previousBlooms = queryClient.getQueryData<DailyBloom[]>([
        "dailyBlooms",
      ]);

      // 3. Optimistically update to the new value using .map()
      // THIS IS THE CORE FIX: It finds the item and replaces it.
      queryClient.setQueryData<DailyBloom[]>(["dailyBlooms"], (oldData = []) =>
        oldData.map((bloom) =>
          bloom.id === newBloomData.id
            ? { ...bloom, ...newBloomData.updatedData }
            : bloom
        )
      );

      // 4. Return a context object with the snapshotted value
      return { previousBlooms };
    },

    // --- END: ADD THIS OPTIMISTIC UPDATE LOGIC ---

    // Your original onError logic, but with the context to roll back changes
    onError: (error: AxiosError, variables, context) => {
      // If the mutation fails, roll back to the previous state
      if (context?.previousBlooms) {
        queryClient.setQueryData(["dailyBlooms"], context.previousBlooms);
      }
      const errorMessage = getAxiosErrorMessage(
        error,
        "Failed to update task. Reverting changes."
      );
      toast.error(errorMessage);
    },

    // Your original onSuccess logic, but moved to onSettled
    // This ensures the data is always re-fetched from the server to guarantee consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyBlooms"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/user/daily-bloom/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success("Deleted successfully");
    },
    onError: (error: AxiosError) => {
      const errorMessage = getAxiosErrorMessage(
        error,
        "Failed to delete task."
      );
      toast.error(errorMessage);
    },
  });

  const onSubmit = (formData: DailyBloomFormType) => {
    const dataToSubmit =
      addInputType === "date"
        ? { ...formData, frequency: undefined }
        : { ...formData, dueDate: undefined };
    createMutation.mutate(dataToSubmit);
  };

  const onUpdate = (formData: DailyBloomFormType) => {
    if (editData) {
      updateMutation.mutate(
        { id: editData.id, updatedData: formData },
        {
          onSuccess: () => {
            toast.success("Updated successfully");
            setEditData(null);
          },
        }
      );
    }
  };

  const handleCloseEditModal = () => {
    setEditData(null);
    reset(defaultFormValues);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleUpdateCompletion = (bloom: DailyBloom, isCompleted: boolean) => {
    updateMutation.mutate(
      {
        id: bloom.id,
        updatedData: { ...bloom, isCompleted },
      },
      {
        onSuccess: () => {
          toast.success(
            `Task marked as ${isCompleted ? "complete" : "pending"}.`
          );
        },
      }
    );
  };

  const handleUpdateBloomFromEvent = (payload: {
    id: string; // This is the raw bloom ID from the calendar
    updatedData: {
      title?: string;
      description?: string;
      dueDate?: string; // This is the 'start' date from the calendar event as an ISO string
    };
  }) => {
    // 1. Attempt to find the original bloom in the parent's current state.
    const originalBloom = dailyBloom.find((b) => b.id === payload.id);

    // --- FIX START ---
    // 2. Handle the case where the bloom is not found (due to a race condition).
    if (!originalBloom) {
      // Instead of erroring, log a warning and invalidate the query.
      // The user's optimistic update in the calendar is already visually correct.
      // This refetch will ensure the parent's state catches up to the database.
      console.warn(
        `Could not find bloom with id: ${payload.id} in local cache. This is likely a race condition after a create. Triggering a refetch to sync.`
      );
      queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
      return; // Exit the function gracefully.
    }
    // --- FIX END ---

    // 3. If the bloom was found, proceed with the update as normal.
    // Create the complete data object for the mutation.
    const updatedBloomData: DailyBloomFormType = {
      ...originalBloom,
      title: payload.updatedData.title ?? originalBloom.title,
      description:
        payload.updatedData.description ?? originalBloom.description ?? "",
      dueDate: payload.updatedData.dueDate
        ? new Date(payload.updatedData.dueDate)
        : originalBloom.dueDate
          ? new Date(originalBloom.dueDate)
          : new Date(),
    };

    // 4. Use the existing updateMutation to save the changes.
    updateMutation.mutate(
      { id: payload.id, updatedData: updatedBloomData },
      {
        onSuccess: () => {
          toast.success("Bloom updated from calendar!");
        },
        // You can add an onError callback here if needed
        onError: (error) => {
          // Revert optimistic updates if the mutation fails
          console.error("Failed to update bloom from calendar event:", error);
          toast.error("Failed to sync calendar change.");
          queryClient.invalidateQueries({ queryKey: ["dailyBloom"] });
        },
      }
    );
  };

  const handleDeleteBloom = (bloomId: string) => {
    // 1. Basic validation to ensure an ID was actually passed.
    if (!bloomId) {
      toast.error("Cannot delete item: Invalid ID provided.");
      console.error("An empty or null ID was passed to handleDeleteBloom.");
      return;
    }

    // 2. Conditionally remove the "bloom-" prefix if it exists.
    //    If it doesn't exist, use the ID as is.
    const actualBloomId = bloomId.startsWith("bloom-")
      ? bloomId.replace("bloom-", "")
      : bloomId;

    // 3. Trigger the delete mutation with the clean, correct ID.
    deleteMutation.mutate(actualBloomId, {
      onSuccess: () => {
        // The onSuccess logic from the useMutation hook already handles
        // query invalidation and showing a success toast.
        // You can add extra logging here if needed.
        console.log(
          `Deletion successfully triggered for bloom: ${actualBloomId}`
        );
      },
      onError: (error) => {
        // Optional: Add specific error handling for calendar deletions.
        console.error(
          `Failed to delete bloom ${actualBloomId} from calendar:`,
          error
        );
      },
    });
  };

  // Normalize bloom data and assert the correct type for the calendar component
  const normalizedBlooms = dailyBloom.map((b) => ({
    id: b.id ?? crypto.randomUUID(),
    title: b.title ?? "",
    description: b.description ?? null,
    isCompleted: b.isCompleted ?? false,
    // This correctly converts the date to a string
    dueDate: b.dueDate ? new Date(b.dueDate).toISOString() : null,
    frequency: b.frequency ?? null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt ?? new Date().toISOString(),
    taskAddJP: b.taskAddJP ?? false,
    taskCompleteJP: b.taskCompleteJP ?? false,
    isFromEvent: b.isFromEvent ?? false,
  })) as CalendarBloom[]; // This assertion forces TypeScript to accept the correct type

  // FIX: Create a single, unified source of truth for the calendar
  const combinedCalendarItems = useMemo(() => {
    // 1. Map your `dailyBloom` data (which is optimistically updated)
    //    into the format FullCalendar expects. This is the primary source for blooms.
    const bloomEvents = dailyBloom.map((bloom) => ({
      id: `bloom-${bloom.id}`,
      title: bloom.title,
      start: bloom.dueDate
        ? new Date(bloom.dueDate).toISOString()
        : new Date().toISOString().split("T")[0],
      allDay: true,
      color: bloom.isCompleted ? "#a5d8ff" : "#4dabf7", // Light blue for completed, dark for pending
      extendedProps: {
        isBloom: true,
        isCompleted: bloom.isCompleted,
        description: bloom.description ?? "",
      },
    }));

    // 2. Take the separate `events` from your other API call but
    //    filter out any that are also blooms to prevent duplicates.
    const regularEvents = (events ?? []).filter(
      (event) => !event.extendedProps?.isBloom
    );

    // 3. Combine them into a single array.
    return [...bloomEvents, ...regularEvents];
  }, [dailyBloom, events]); // This will re-compute whenever your blooms or events change

  return (
    <div>
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setAddData(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Daily Bloom
              </Button>
              <Button onClick={() => setCalendarOpen(true)}>
                <CalendarIcon className="mr-2 h-4 w-2" />
                View My Calendar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="mb-8">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              View your blooms and events in a calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardContent>
              <DailyBloomCalendar
                blooms={normalizedBlooms}
                events={combinedCalendarItems}
                onCreateBloomFromEvent={handleCreateBloomFromEvent}
                onUpdateBloomFromEvent={handleUpdateBloomFromEvent}
                onDeleteBloomFromEvent={handleDeleteBloom}
              />
            </CardContent>
          </CardContent>
        </Card> */}

        <Overdue
          onView={setViewData}
          onEdit={setEditData}
          onDelete={setDeleteId}
          onUpdateCompletion={handleUpdateCompletion}
        />

        {isLoading ? (
          <PageSkeleton type="leaderboard" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Daily Blooms</CardTitle>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-2">
                <CardDescription className="w-full">
                  Overview of your tracked blooms
                </CardDescription>
                <div className="flex w-full md:w-auto items-center space-x-2 justify-end">
                  <div className="relative group w-1/2 md:w-36">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>{statusFilter}</span>
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="absolute z-10 w-full top-full mt-1 bg-background border rounded-md shadow-lg p-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant={
                          statusFilter === "Pending" ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setStatusFilter("Pending")}
                      >
                        Pending
                      </Button>
                      <Button
                        type="button"
                        variant={
                          statusFilter === "Completed" ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setStatusFilter("Completed")}
                      >
                        Completed
                      </Button>
                    </div>
                  </div>
                  <div className="relative group w-1/2 md:w-36">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>{frequencyFilter}</span>
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="absolute z-10 w-full top-full mt-1 bg-background border rounded-md shadow-lg p-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant={
                          frequencyFilter === "All" ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter("All")}
                      >
                        All
                      </Button>
                      <Button
                        type="button"
                        variant={
                          frequencyFilter === "Daily" ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter("Daily")}
                      >
                        Daily
                      </Button>
                      <Button
                        type="button"
                        variant={
                          frequencyFilter === "Weekly" ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter("Weekly")}
                      >
                        Weekly
                      </Button>
                      <Button
                        type="button"
                        variant={
                          frequencyFilter === "Monthly" ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFrequencyFilter("Monthly")}
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
                  <p className="text-muted-foreground">No blooms Available.</p>
                </div>
              ) : (
                <>
                  {isMobile ? (
                    // --- MOBILE: Card View ---
                    <div className="space-y-4">
                      {dailyBloom.map((bloom: DailyBloom) => (
                        <Card key={bloom.id} className="p-4">
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-md sm:text-lg max-w-[80%] break-words">
                                {bloom.title}
                              </CardTitle>
                              {bloom.isFromEvent && (
                                <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-md self-start">
                                  From Event
                                </span>
                              )}

                              <Input
                                type="checkbox"
                                checked={bloom.isCompleted}
                                onChange={(e) =>
                                  handleUpdateCompletion(
                                    bloom,
                                    e.target.checked
                                  )
                                }
                                className="w-5 h-5 rounded-md cursor-pointer flex-shrink-0"
                              />
                            </div>
                            {bloom.description && (
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                {bloom.description}
                              </p>
                            )}
                            <div className="flex flex-col space-y-2 text-sm border-t pt-3">
                              {bloom.frequency && (
                                <div className="flex items-center">
                                  <Repeat className="w-4 h-4 mr-2 text-muted-foreground" />
                                  <span>Frequency - {bloom.frequency}</span>
                                </div>
                              )}
                              {bloom.dueDate && (
                                <div className="flex items-center">
                                  <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                  <span>
                                    Due:{" "}
                                    {new Date(bloom.dueDate).toLocaleDateString(
                                      "en-IN"
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 border-t pt-3">
                              <Button
                                className="p-2 h-auto bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-md transition-colors"
                                onClick={() => setViewData(bloom)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                className="p-2 h-auto bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-md transition-colors"
                                onClick={() => setEditData(bloom)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                className="p-2 h-auto bg-red-100 text-red-800 hover:bg-red-200 rounded-md transition-colors"
                                onClick={() => setDeleteId(bloom.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // --- DESKTOP: Table View ---
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="w-[80px] text-center"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="w-[130px]">Due Date</TableHead>
                          <TableHead className="w-[120px]">Frequency</TableHead>
                          <TableHead className="w-[140px] text-center">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyBloom.map((bloom) => (
                          <TableRow key={bloom.id}>
                            <TableCell className="text-center">
                              <Input
                                type="checkbox"
                                checked={bloom.isCompleted}
                                onChange={(e) =>
                                  handleUpdateCompletion(
                                    bloom,
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded-md cursor-pointer"
                              />
                            </TableCell>
                            <TableCell
                              className="font-medium relative"
                              onMouseEnter={() => setHoveredBloomId(bloom.id)}
                              onMouseLeave={() => setHoveredBloomId(null)}
                            >
                              <div className="flex items-center gap-2">
                                <span>
                                  {bloom.title.length > 30
                                    ? `${bloom.title.slice(0, 30)}...`
                                    : bloom.title}
                                </span>
                                {bloom.isFromEvent && (
                                  <span className="text-xs text-blue-600 font-medium bg-blue-100 px-1.5 py-0.5 rounded">
                                    Event
                                  </span>
                                )}
                              </div>
                              {hoveredBloomId === bloom.id && (
                                <div className="absolute z-50 top-0 left-full ml-2 w-80 rounded-lg border bg-background p-4 shadow-xl">
                                  <HoverDetails bloom={bloom} />
                                </div>
                              )}
                            </TableCell>

                            <TableCell>
                              {bloom.dueDate
                                ? new Date(bloom.dueDate).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell>{bloom.frequency || "-"}</TableCell>
                            <TableCell className="flex items-center justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewData(bloom)}
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditData(bloom)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(bloom.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="p-4">
              {hasNextPage && (
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="secondary"
                  className="w-full font-semibold text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
        <Dialog open={addData} onOpenChange={setAddData}>
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Add Your Bloom
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="title-add">Title</Label>
                  <Input id="title-add" {...register("title")} />
                  {errors.title && (
                    <p className="text-red-500 text-sm">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="desc-add">Description</Label>
                  <Textarea id="desc-add" {...register("description")} />
                  {errors.description && (
                    <p className="text-red-500 text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm text-muted-foreground">
                    Select one: Due Date or Frequency
                  </Label>
                  <div className="flex bg-muted p-1 rounded-md">
                    <Button
                      type="button"
                      onClick={() => {
                        setAddInputType("date");
                        setValue("frequency", undefined);
                        setValue("dueDate", new Date());
                      }}
                      variant={addInputType === "date" ? "default" : "ghost"}
                      className="flex-1"
                    >
                      Due Date
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setAddInputType("frequency");
                        setValue("dueDate", undefined);
                        setValue("frequency", "Daily");
                      }}
                      variant={
                        addInputType === "frequency" ? "default" : "ghost"
                      }
                      className="flex-1"
                    >
                      Frequency
                    </Button>
                  </div>
                </div>
                {addInputType === "date" ? (
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <div className="grid w-full items-center gap-1.5">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          min={today}
                          value={
                            field.value &&
                            !isNaN(new Date(field.value).getTime())
                              ? format(new Date(field.value), "yyyy-MM-dd")
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
                          <p className="text-sm text-red-500 mt-1">
                            {errors.dueDate.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => {
                      const { value, ...restOfField } = field;
                      return (
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="frequency-select">Frequency</Label>
                          <select
                            id="frequency-select"
                            {...restOfField}
                            value={value || ""}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                          {errors.frequency && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.frequency.message}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
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

        <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Bloom Details
              </DialogTitle>
            </DialogHeader>
            {viewData && (
              <div className="grid gap-6 py-4">
                <div className="flex items-start gap-4">
                  <FileText className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="grid gap-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      Title
                    </p>
                    <p className="text-base font-semibold break-all">
                      {viewData.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="grid gap-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p className="text-base text-gray-700 break-all">
                      {viewData.description || (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>
                {viewData.dueDate && (
                  <div className="flex items-start gap-4">
                    <CalendarIcon className="h-6 w-6 text-muted-foreground mt-1" />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Due Date
                      </p>
                      <p className="text-base">
                        {new Date(viewData.dueDate).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {viewData.frequency && (
                  <div className="flex items-start gap-4">
                    <Repeat className="h-6 w-6 text-muted-foreground mt-1" />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Frequency
                      </p>
                      <p className="text-base">{viewData.frequency}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setViewData(null)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editData}
          onOpenChange={(isOpen) => !isOpen && handleCloseEditModal()}
        >
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Edit Daily Bloom
              </DialogTitle>
              <DialogDescription>
                Make changes to your entry below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onUpdate)}>
              <div className="grid gap-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="title-edit">Title</Label>
                  <Input id="title-edit" {...register("title")} />
                  {errors.title && (
                    <p className="text-sm text-red-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="desc-edit">Description</Label>
                  <Textarea id="desc-edit" {...register("description")} />
                  {errors.description && (
                    <p className="text-red-500 text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                {editData?.dueDate ? (
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
                            field.value &&
                            !isNaN(new Date(field.value).getTime())
                              ? format(new Date(field.value), "yyyy-MM-dd")
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
                          <p className="text-sm text-red-500 mt-1">
                            {errors.dueDate.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => {
                      const { value, ...restOfField } = field;
                      return (
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="frequency-edit-select">
                            Frequency
                          </Label>
                          <select
                            id="frequency-edit-select"
                            {...restOfField}
                            value={value || ""}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                          {errors.frequency && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.frequency.message}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
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

        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <DialogHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="mt-4 text-xl font-semibold text-gray-800">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this bloom? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
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

        {/* New Dialog for Calendar */}
        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
          <DialogContent className="w-[90vw] max-w-4xl rounded-2xl bg-white p-2 shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                My Calendar
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 h-[70vh] overflow-auto">
              <DailyBloomCalendar
                blooms={normalizedBlooms}
                events={combinedCalendarItems}
                onCreateBloomFromEvent={handleCreateBloomFromEvent}
                onUpdateBloomFromEvent={handleUpdateBloomFromEvent}
                onDeleteBloomFromEvent={handleDeleteBloom}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCalendarOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
