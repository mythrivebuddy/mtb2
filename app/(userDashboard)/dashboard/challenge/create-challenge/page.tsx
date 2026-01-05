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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { getJpAmountForActivity } from "@/lib/utils/jpAmount";
import { ActivityType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  const router = useRouter();
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md ">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {title}
          </DialogTitle>
          <DialogDescription className="text-md text-slate-600 mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="!flex !flex-col gap-2">
          <Button onClick={onClose} className="bg-red-600  hover:bg-red-700 ">
            Continue with Free Plan
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/subscription`)}
            className="bg-green-700 hover:bg-green-800"
          >
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
    message: string;
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

export default function CreateChallenge({}: CreateChallengeProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [isShowingCertificateToggle, setIsShowingCertificateToggle] =
    useState(false);

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
    watch,
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
      social_link_task: "",
    },
  });
 
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const { fields, append, remove } = useFieldArray({ name: "tasks", control });

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
        toast.success(data.data?.message || "Challenge created successfully");
        queryClient.invalidateQueries({ queryKey: ["getAllChallenges"] });
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
  let message = "Something went wrong. Please try again.";

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string") {
      message = data;
    } else if (typeof data?.message === "string") {
      message = data.message;
    } else if (typeof error.message === "string") {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  setModalContent({
    title: "Challenge Creation Failed",
    message,
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

  useEffect(() => {
    if (!startDate || !endDate) {
      setIsShowingCertificateToggle(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize both dates
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    setIsShowingCertificateToggle(diffInDays >= 5);
  }, [startDate, endDate]);

  

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
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Title */}
              <div className="flex-1">
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

              {/* Cost */}
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
                  className="w-[6rem] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("cost", { valueAsNumber: true })}
                />
                {errors.cost && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.cost.message}
                  </p>
                )}
              </div>

              {/* Reward */}
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
                  className="w-[6rem] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Editor
                    id="description"
                    key="challenge-description-editor"
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    value={field.value}
                    onEditorChange={(content) => field.onChange(content)}
                    init={{
                      height: 400,
                      menubar: false,
                      toolbar_mode: "sliding",
                      promotion: false,
                      // ✅ Removed "link" and "code" from plugins
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "help",
                        "wordcount",
                      ],
                      // ✅ Removed "link" and "code" buttons from toolbar
                      toolbar:
                        "undo redo | blocks | bold italic underline | bullist numlist | alignleft aligncenter alignright alignjustify | removeformat | preview | help",

                      block_formats: "Paragraph=p",

                      valid_elements:
                        "p,h1,h2,h3,strong,em,ul,ol,li,blockquote,span,div,br",
                      extended_valid_elements: "",

                      verify_html: false,
                      cleanup: false,
                      forced_root_block: "p",

                      placeholder:
                        "Describe the goals, rules, and what makes your challenge unique...",

                      content_style: `
          body { font-family: Inter, sans-serif; font-size: 14px; color: #334155; line-height: 1.6; }
          h1 { font-size: 1.8em; font-weight: 700; color: #1e293b; margin-top: 1rem; margin-bottom: 0.5rem; }
          h2 { font-size: 1.5em; font-weight: 600; color: #334155; margin-top: 0.75rem; margin-bottom: 0.5rem; }
          h3 { font-size: 1.25em; font-weight: 600; color: #475569; margin-top: 0.5rem; margin-bottom: 0.5rem; }
          blockquote { border-left: 3px solid #c084fc; margin-left: 0; padding-left: 1rem; color: #4b5563; font-style: italic; background-color: #f9fafb; border-radius: 0.25rem; }
          p { margin: 0.5rem 0; }
        `,
                    }}
                  />
                )}
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
                  render={({ field }) => {
                    // ✅ Ensure the value is always a Date or null (never an object)
                    const value =
                      field.value instanceof Date
                        ? field.value
                        : typeof field.value === "string"
                          ? new Date(field.value)
                          : null;

                    return (
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="startDate"
                          type="date"
                          min={formatDateForInput(today)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={formatDateForInput(value)}
                          onChange={(e) => {
                            const newDate = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            field.onChange(newDate);
                          }}
                        />
                      </div>
                    );
                  }}
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
                  render={({ field }) => {
                    const value =
                      field.value instanceof Date
                        ? field.value
                        : typeof field.value === "string"
                          ? new Date(field.value)
                          : null;

                    return (
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="endDate"
                          type="date"
                          min={formatDateForInput(today)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={formatDateForInput(value)}
                          onChange={(e) => {
                            const newDate = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            field.onChange(newDate);
                          }}
                        />
                      </div>
                    );
                  }}
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
                  <div className="flex items-center">
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
                <PlusCircle className="h-5 w-5" /> Add Another Task
              </button>
              {fields.length >= 3 && (
                <p className="mt-2 text-center text-sm text-slate-500">
                  Maximum of 3 tasks reached.
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="social_link_task"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Related Link:
              </label>
              <input
                type="text"
                id="social_link_task"
                className={`flex-1 w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 ${
                  errors.social_link_task
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-200 bg-slate-50 focus:ring-purple-500"
                }`}
                {...register("social_link_task", {
                  required: "Social media link is required",
                  pattern: {
                    value:
                      /^(https?:\/\/)([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$/,
                    message:
                      "Please enter a valid URL (must start with http:// or https://)",
                  },
                })}
                placeholder="Enter the YouTube or Instagram link for this challenge"
              />
              {errors.social_link_task && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.social_link_task.message}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Add one YouTube or Instagram link related to this challenge —
                for example, a promo video.
              </p>
            </div>

            {isShowingCertificateToggle && (
              <div className="flex gap-4 items-center">
                <Label
                  htmlFor="multiple"
                  className="cursor-pointer font-medium text-sm"
                >
                  Completion Certificate
                </Label>
                <Controller
                  name="isIssuingCertificate"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="multiple"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}


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
          </form>
        </div>
      </div>
    </>
  );
}
