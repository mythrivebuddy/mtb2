"use client";

import {
  useForm,
  useFieldArray,
  SubmitHandler,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { challengeSchema, challengeSchemaFormType } from "@/schema/zodSchema";
import {
  PlusCircle,
  X,
  Calendar as CalendarIcon,
  AlertTriangle,
 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { getJpAmountForActivity } from "@/lib/utils/jpAmount";
import { ActivityType } from "@prisma/client";

// --- Helper function to generate a URL-friendly slug from a title ---
const generateSlug = (title: string) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single one
};

type CreateChallengeProps = {
  onSuccess?: () => void;
};



// --- A reusable modal component for displaying messages ---
const MessageModal = ({
  isOpen,
  onClose,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="m-4 w-full max-w-md transform rounded-2xl bg-white p-6 text-center shadow-xl transition-all">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
        <div className="mt-2">
          <p className="text-md text-slate-600">{message}</p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto sm:text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Type definitions ---
interface UserData {
  jpBalance: number;
}

// ✨ FIX: Define a specific type for the mutation's successful response data
interface ChallengeApiResponse {
  data: {
    id: string;
    title: string;
  };
}

// --- API function to fetch user data ---
const fetchUser = async (): Promise<UserData> => {
  const { data } = await axios.get("/api/user");
  return data.user;
};

// --- Helper to format a Date object to a 'YYYY-MM-DD' string for input[type=date] ---
const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ""; // Return empty string for invalid or missing dates
  }
  return date.toISOString().split("T")[0];
};

export default function CreateChallenge({ }: CreateChallengeProps) {
  const router = useRouter();
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<UserData, Error>({
    queryKey: ["currentUser"],
    queryFn: fetchUser,
  });

  const { data: challengeCreationFee, isLoading: isFeeLoading } = useQuery<
    number,
    Error
  >({
    queryKey: ["challengeCreationFee"],
    queryFn: () =>
      getJpAmountForActivity("CHALLENGE_CREATION_FEE" as ActivityType),
    staleTime: Infinity,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<challengeSchemaFormType>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      mode: "PUBLIC",
      tasks: [{ description: "" }],
      cost: 50,
      reward: 50,
      penalty: 0,
      startDate: new Date(new Date().setDate(today.getDate() + 2)),
      endDate: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({ name: "tasks", control });

  // ✨ FIX: Replace 'any' with the specific 'ChallengeApiResponse' type
  const mutation = useMutation<
    ChallengeApiResponse,
    Error,
    challengeSchemaFormType
  >({
    mutationFn: async (data) => {
      const response = await axios.post("/api/challenge", data);
      return response.data;
    },
    onSuccess: (data) => {
      const challengeId = data.data?.id;
      const challengeTitle = data.data?.title;
      if (challengeId && challengeTitle) {
        const slug = generateSlug(challengeTitle);
        router.push(
          `/dashboard/challenge/let-others-roll?slug=${slug}&uuid=${challengeId}`
        );
      } else {
        setModalContent({
          title: "Action Required",
          message:
            "Challenge created, but we couldn't get the shareable link. You can find your challenge in 'My Challenges'.",
        });
      }
    },
    onError: (error) => {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error || error.message
          : error.message;
      setModalContent({
        title: "Challenge Creation Failed",
        message: errorMessage,
      });
    },
  });

  const onSubmit: SubmitHandler<challengeSchemaFormType> = (data) => {
    if (typeof challengeCreationFee !== "number") {
      setModalContent({
        title: "Please Wait",
        message:
          "The creation fee is still being calculated. Please try again in a moment.",
      });
      return;
    }
    if (user && user.jpBalance < challengeCreationFee) {
      setModalContent({
        title: "Insufficient Balance",
        message: `You need ${challengeCreationFee} JP to create a challenge, but you only have ${user.jpBalance} JP.`,
      });
      return;
    }
    mutation.mutate(data);
  };

  if (isUserLoading || isFeeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Loading challenge data...</p>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <p className="text-lg text-red-500">
          Error: {userError.message}. Please try again later.
        </p>
      </div>
    );
  }


  return (
    <>
      <MessageModal
        isOpen={!!modalContent}
        onClose={() => {
          setModalContent(null);
          if (mutation.isSuccess) {
            router.push("/dashboard/challenge");
          }
          if (mutation.isError || mutation.isSuccess) {
            mutation.reset();
          }
        }}
        title={modalContent?.title ?? ""}
        message={modalContent?.message ?? ""}
      />

      <div className="w-full py-8 md:py-12">
        <div className="mx-auto w-full max-w-4xl px-4">
         

          <div className="mb-8 text-center">
            <div className="mb-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-end sm:gap-4">
              <div className="rounded-lg bg-blue-100 px-4 py-2 font-bold text-blue-800 shadow-md">
                Creation Fee: {challengeCreationFee ?? "..."} JP
              </div>
              <div className="rounded-lg bg-purple-100 px-4 py-2 font-bold text-purple-800 shadow-md">
                Your JP Balance: {user?.jpBalance ?? "N/A"}
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 md:text-4xl">
              Create Your Challenge
            </h1>
            <p className="mt-2 text-lg text-slate-500">
              Craft a unique challenge and inspire others!
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl md:p-8"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Challenge Title
                </label>
                <input
                  id="title"
                  placeholder="e.g., 30-Day Fitness"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="cost"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Cost (JP)
                </label>
                <input
                  id="cost"
                  type="number"
                  placeholder="50"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("cost", { valueAsNumber: true })}
                />
                {errors.cost && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.cost.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="reward"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Reward (JP)
                </label>
                <input
                  id="reward"
                  type="number"
                  placeholder="50"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("reward", { valueAsNumber: true })}
                />
                {errors.reward && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.reward.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Detailed Description
              </label>
              <textarea
                id="description"
                placeholder="Explain the goals, rules, and what this challenge is about."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Start Date
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="startDate"
                        type="date"
                        min={formatDateForInput(today)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formatDateForInput(field.value)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                      />
                    </div>
                  )}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  End Date
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="endDate"
                        type="date"
                        min={formatDateForInput(today)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formatDateForInput(field.value)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                      />
                    </div>
                  )}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Challenge Mode
                </label>
                <div className="flex items-center space-x-6 pt-2">
                  <label
                    htmlFor="modePublic"
                    className="flex cursor-pointer items-center"
                  >
                    <input
                      id="modePublic"
                      type="radio"
                      value="PUBLIC"
                      {...register("mode")}
                      className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-slate-700">Public</span>
                  </label>
                  <label
                    htmlFor="modePersonal"
                    className="flex cursor-pointer items-center"
                  >
                    <input
                      id="modePersonal"
                      type="radio"
                      value="PERSONAL"
                      {...register("mode")}
                      className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-slate-700">Personal</span>
                  </label>
                </div>
              </div>
              <div>
                <label
                  htmlFor="penalty"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Penalty (JP)
                </label>
                <input
                  id="penalty"
                  type="number"
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("penalty", { valueAsNumber: true })}
                />
                {errors.penalty && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.penalty.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-800">Challenge Tasks</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor={`task-${index}`}
                      className="sr-only"
                    >{`Task #${index + 1}`}</label>
                    <input
                      id={`task-${index}`}
                      placeholder={`Task #${index + 1}`}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      {...register(`tasks.${index}.description`)}
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-100"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                  {errors.tasks?.[index]?.description && (
                    <p className="pl-1 text-sm text-red-500">
                      {errors.tasks[index]?.description?.message}
                    </p>
                  )}
                </div>
              ))}
              {errors.tasks?.root && (
                <p className="text-sm text-red-500">
                  {errors.tasks.root.message}
                </p>
              )}

              <button
                type="button"
                onClick={() => append({ description: "" })}
                disabled={fields.length >= 3}
                className="flex items-center justify-center rounded-lg bg-purple-100 px-4 py-3 font-semibold text-purple-700 transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Another Task
              </button>
              {fields.length >= 3 && (
                <p className="mt-2 text-center text-sm text-slate-500">
                  Maximum of 3 tasks reached.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full rounded-lg bg-slate-200 px-8 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-300 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {mutation.isPending ? "Creating..." : "Create Challenge"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
