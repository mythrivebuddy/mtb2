"use client";
// dashboard/challenge/upcoming-challenges/[challengeId]/page.tsx
import { useState, useEffect } from "react";
import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Award,
  Calendar,
  CheckCircle,
  Users,
  Loader2,
  PartyPopper,
  AlertTriangle,
  Coins,
  ShieldAlert,
  UserCircle,
} from "lucide-react";
import {
  type Challenge,
  type ChallengeTask,
  type ChallengeEnrollment,
  type UserChallengeTask,
  type User,
  ChallengeJoiningType,
} from "@prisma/client";
import AppLayout from "@/components/layout/AppLayout";
import { useQueryClient } from "@tanstack/react-query";
import ChallengeDescription from "@/components/Dompurify";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { DashboardContent } from "@/types/client/dashboard";
//import { useSearchParams } from "next/navigation";

type Creator = Pick<User, "id" | "name">;

type ChallengeWithTasksAndCount = Challenge & {
  creator: Creator;
  templateTasks: ChallengeTask[];
  _count: { enrollments: number };
};

type EnrollmentWithTasks = ChallengeEnrollment & {
  userTasks: UserChallengeTask[];
};

interface ChallengeDetailViewProps {
  challenge: ChallengeWithTasksAndCount;
  initialEnrollment: EnrollmentWithTasks | null;
}

const formatDate = (dateString: string | Date) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getChallengeDuration = (
  startDateString: string | Date,
  endDateString: string | Date,
): string => {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const days = Math.round(timeDiff / (1000 * 60 * 60 * 24)) + 1;
  if (days <= 0) return "";
  if (days === 1) return `(${days} day)`;
  return `(${days} days)`;
};

export default function ChallengeDetailView({
  challenge,
  initialEnrollment,
}: ChallengeDetailViewProps) {
  const router = useRouter();
  const { status: sessionStatus, data: session } = useSession();
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<{
    message: string;
    isUpgradeFlagShow?: boolean;
  } | null>(null);

  const [isEnrollSuccessModalOpen, setIsEnrollSuccessModalOpen] =
    useState(false);
  const [autoEnrollAttempted, setAutoEnrollAttempted] = useState(false);

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [hasPaidOrder, setHasPaidOrder] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const autoEnrollTriggered = useRef(false);

  useEffect(() => {
    if (!orderId || enrollment || autoEnrollAttempted) return;

    const verifyPayment = async () => {
      try {
        setIsCheckingPayment(true);

        const res = await axios.get(
          `/api/billing/razorpay/challenge/verify-payment?orderId=${orderId}&challengeId=${challenge.id}`,
        );

        if (res.data?.paid && !autoEnrollTriggered.current) {
          autoEnrollTriggered.current = true;
          setHasPaidOrder(true);
          toast.success(
            `🎉 Payment Successful!\n\n` +
              `${challenge.title}\n` +
              `Please do not close this page while we complete your enrollment.`,
          );

          setAutoEnrollAttempted(true);
          try {
            setIsEnrolling(true);

            await autoEnrollWithRetry(challenge.id);

            const enrollmentResp = await axios.get(
              `/api/challenge/enrollments/${challenge.id}`,
            );
            setEnrollment(enrollmentResp.data.enrollment);
            queryClient.setQueryData<DashboardContent>(
              ["dashboard-content"],
              (old) => {
                if (!old) return old;

                const existing = old.challenges || [];

                return {
                  ...old,
                  challenges: [
                    ...existing.filter(
                      (item) => item.challenge.id !== challenge.id,
                    ),
                    {
                      challenge: {
                        id: challenge.id,
                        title: challenge.title,
                      },
                    },
                  ].slice(0, 3),
                };
              },
            );
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["myChallenges", "hosted"],
              }),
              queryClient.invalidateQueries({
                queryKey: ["myChallenges", "joined"],
              }),
              queryClient.invalidateQueries({ queryKey: ["getAllChallenges"] }),
            ]);
            toast.success("You have successfully enrolled in this challenge.");

            router.replace(
              `/dashboard/challenge/my-challenges/${challenge.id}`,
            );
          } catch (err) {
            console.error("Auto enroll failed", err);

            await axios.post("/api/challenge/enroll-failure", {
              challengeId: challenge.id,
              orderId,
            });
          } finally {
            setIsEnrolling(false);
          }
        }
      } catch (err) {
        console.error("Payment verification failed", err);
      } finally {
        setIsCheckingPayment(false);
      }
    };

    verifyPayment();
  }, [orderId, challenge.id]);

  useEffect(() => {
    if (enrollment && enrollment.userTasks.length === 0 && !hasPaidOrder) {
      setIsPolling(true);
      const poll = setInterval(async () => {
        try {
          const response = await axios.get(
            `/api/challenge/enrollments/${challenge.id}`,
          );
          const updatedEnrollment: EnrollmentWithTasks =
            response.data.enrollment;
          if (updatedEnrollment?.userTasks.length > 0) {
            setEnrollment(updatedEnrollment);
            setIsPolling(false);
            setIsEnrollSuccessModalOpen(true);
            clearInterval(poll);
          }
        } catch (err) {
          console.error("Polling failed:", err);
          setError({
            message:
              "Could not confirm enrollment status. Please refresh the page.",
          });

          setIsPolling(false);
          clearInterval(poll);
        }
      }, 3000);
      return () => clearInterval(poll);
    }
  }, [enrollment, challenge.id]);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setError(null);
    try {
      await axios.post("/api/challenge/enroll", { challengeId: challenge.id });

      const enrollmentResp = await axios.get(
        `/api/challenge/enrollments/${challenge.id}`,
      );
      const fetchedEnrollment: EnrollmentWithTasks =
        enrollmentResp.data.enrollment;

      setEnrollment(fetchedEnrollment);
      queryClient.setQueryData<DashboardContent>(
        ["dashboard-content"],
        (old) => {
          if (!old) return old;

          const existing = old.challenges || [];

          return {
            ...old,
            challenges: [
              ...existing.filter((item) => item.challenge.id !== challenge.id),
              {
                challenge: {
                  id: challenge.id,
                  title: challenge.title,
                },
              },
            ].slice(0, 3), // keep same pattern as dashboard
          };
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["myChallenges", "hosted"] }),
        queryClient.invalidateQueries({ queryKey: ["myChallenges", "joined"] }),
        queryClient.invalidateQueries({ queryKey: ["getAllChallenges"] }),
      ]);
      toast.success("You have successfully enrolled in this challenge.");
      router.push(`/dashboard/challenge/my-challenges/${challenge.id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data;

        if (typeof errorData === "object" && errorData.message) {
          setError({
            message: errorData.message,
            isUpgradeFlagShow: errorData.isUpgradeFlagShow,
          });
          return;
        }
      }

      setError({
        message: "An unexpected error occurred. Please try again.",
      });
      toast.error(getAxiosErrorMessage(err));
    } finally {
      setIsEnrolling(false);
    }
  };

  const autoEnrollWithRetry = async (challengeId: string, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await axios.post("/api/challenge/enroll", { challengeId });
        return true;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;

          // already enrolled → stop retries
          if (status === 409) return true;

          // client errors should not retry
          if (status && status < 500) throw err;
        }

        if (attempt === retries) throw err;

        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  };

  const handleJoinClick = () => {
    if (sessionStatus === "loading") return;

    if (sessionStatus !== "authenticated") {
      const redirectPath = `/dashboard/challenge/upcoming-challenges/${challenge.id}`;
      router.push(`/signin?redirect=${redirectPath}`);
      return;
    }

    if (challenge.challengeJoiningType === ChallengeJoiningType.PAID) {
      router.push(
        `/dashboard/membership/checkout?context=CHALLENGE&challengeId=${challenge.id}`,
      );
    } else {
      handleEnroll();
    }
  };
  const handleCloseModalAndRedirect = async () => {
    setIsEnrollSuccessModalOpen(false);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["myChallenges", "hosted"] }),
      queryClient.invalidateQueries({ queryKey: ["myChallenges", "joined"] }),
    ]);

    router.replace(`/dashboard/challenge/my-challenges/${challenge.id}`);
  };

  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const pageContent = (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-slate-800">
              {challenge.title}
            </h1>
            <div className="flex items-center gap-x-3 my-4">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[challenge.status] || "bg-gray-100"}`}
              >
                {challenge.status}
              </span>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${challenge.mode === "PUBLIC" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"}`}
              >
                {challenge.mode}
              </span>
            </div>
          </div>

          {/* Description */}
          {/* <p className="text-slate-600 text-lg mb-8">{challenge.description}</p> */}
          {challenge.description && (
            <ChallengeDescription html={challenge.description} />
          )}

          {/* Tasks Section */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">
              Tasks to Complete
            </h2>
            <ul className="space-y-3">
              {challenge.templateTasks.length > 0 ? (
                challenge.templateTasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <p className="text-slate-800">{task.description}</p>
                  </li>
                ))
              ) : (
                <li className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  No tasks have been added to this challenge yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Sticky Card with Stats & Actions */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
              {/* Duration */}
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-sm text-slate-500">Duration</div>
                  <div className="font-semibold text-slate-700 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span>
                      {formatDate(challenge.startDate)} to{" "}
                      {formatDate(challenge.endDate)}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {getChallengeDuration(
                        challenge.startDate,
                        challenge.endDate,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats List */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div className="flex items-center">
                  <Coins className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-slate-500">Joining Cost</div>
                    <div className="font-semibold text-slate-700">
                      {challenge.challengeJoiningType ===
                        ChallengeJoiningType.PAID && (
                        <>
                          ({challenge.challengeJoiningFee.toLocaleString()}{" "}
                          {challenge.challengeJoiningFeeCurrency}
                          {challenge.challengeJoiningFeeCurrency === "INR" && (
                            <span className="text-xs"> + GST</span>
                          )}
                          ){" + "}
                        </>
                      )}{" "}
                      {challenge.cost > 0 ? `${challenge.cost} GP ` : "Free GP"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Award className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-slate-500">Reward</div>
                    <div className="font-semibold text-slate-700">
                      {challenge.reward} GP
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <ShieldAlert
                    className={`w-6 h-6 mr-3 flex-shrink-0 ${challenge.penalty > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                  <div>
                    <div className="text-sm text-slate-500">Penalty</div>
                    <div className="font-semibold text-slate-700">
                      {challenge.penalty > 0
                        ? `${challenge.penalty} GP`
                        : "None"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-slate-500 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-slate-500">Participants</div>
                    <div className="font-semibold text-slate-700">
                      {challenge._count.enrollments}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <UserCircle className="w-6 h-6 text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-slate-500">Created By</div>
                    <div className="font-semibold text-slate-700">
                      {challenge.creator?.name ?? "Unknown User"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button Section */}
              <div className="pt-6 border-t border-slate-200">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>
                        {error.message}

                        {error.isUpgradeFlagShow &&
                          session?.user.membership === "FREE" && (
                            <>
                              {" "}
                              <span
                                onClick={() =>
                                  router.push("/pricing?ref=join-challenge")
                                }
                                className="underline cursor-pointer font-medium"
                              >
                                Upgrade
                              </span>{" "}
                              to increase the limit.
                            </>
                          )}
                      </span>
                    </div>
                  </div>
                )}

                {(() => {
                  // ✅ Already fully enrolled
                  if (enrollment && enrollment.userTasks.length > 0) {
                    return (
                      <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center">
                        <PartyPopper className="w-6 h-6 mr-2" />
                        <span className="font-semibold text-lg">
                          You have joined!
                        </span>
                      </div>
                    );
                  }

                  // ✅ Payment verification loading
                  if (isCheckingPayment) {
                    return (
                      <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        <span className="font-semibold text-lg">
                          Verifying payment...
                        </span>
                      </div>
                    );
                  }

                  // ✅ Payment verified but not enrolled yet
                  if (hasPaidOrder && !enrollment) {
                    return (
                      <div className="space-y-3">
                        <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg">
                          <span className="font-semibold">
                            You purchased this challenge. Please wait while we
                            confirm your enrollment.
                          </span>
                        </div>

                        <button
                          onClick={handleEnroll}
                          disabled={isEnrolling}
                          className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                          {isEnrolling ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            "Enroll Now"
                          )}
                        </button>
                      </div>
                    );
                  }

                  // ✅ Preparing tasks state
                  if (
                    isPolling ||
                    (enrollment && enrollment.userTasks.length === 0)
                  ) {
                    return (
                      <div className="text-center p-4 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        <span className="font-semibold text-lg">
                          Preparing tasks...
                        </span>
                      </div>
                    );
                  }

                  // ✅ Default join/pay button
                  return (
                    <button
                      onClick={handleJoinClick}
                      disabled={isEnrolling || sessionStatus === "loading"}
                      className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                      {isEnrolling ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : challenge.challengeJoiningType ===
                        ChallengeJoiningType.PAID ? (
                        "Pay & Join Challenge"
                      ) : (
                        "Join Challenge"
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {sessionStatus === "authenticated" ? (
        pageContent
      ) : (
        <AppLayout>{pageContent}</AppLayout>
      )}

      {/* Enrollment Success Modal */}
      {isEnrollSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Successfully Joined!
            </h2>
            <p className="text-slate-500 mb-6">
              You are now enrolled in the &quot;{challenge.title}&quot;
              challenge. Good luck!
            </p>
            <button
              onClick={handleCloseModalAndRedirect}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all"
            >
              View My Challenges
            </button>
          </div>
        </div>
      )}
    </>
  );
}
