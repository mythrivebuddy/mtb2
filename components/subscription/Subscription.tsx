/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { format } from "date-fns";
import {
  Loader2,
  Check,
  Star,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Repeat,
  Gift,
  CheckCircle, // New Icon for Free Grant/Program
} from "lucide-react";
import { toast } from "sonner";
import PageSkeleton from "../PageSkeleton";
import { useSession } from "next-auth/react";
import { getAxiosErrorMessage } from "@/utils/ax";
import { useRouter, useSearchParams } from "next/navigation";
import { PLAN_PRIORITY } from "@/lib/subscription";
import { Card, CardContent } from "../ui/card";

// ✅ ADD THIS — mirrors the Prisma enum without importing it
type PlanInterval = "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";

/* --------------------- API TYPES ---------------------- */

interface SubscriptionPlanFromApi {
  id: string;
  name: string;
  userType: string;
  interval: PlanInterval;  // ← change from string to PlanInterval
  amountINR: number;
  amountUSD: number;
  features?: string[] | null;
}

interface GrantedByProgram {
  id: string;
  name: string;
}

interface CurrentSubscription {
  id: string;
  userId: string;
  planId: string;
  mandateId: string | null;
  orderId: string;
  grantedByPurchaseId: string;
  status:
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "FREE_TRIAL"
  | "PENDING"
  | "CANCELLATION_PENDING"
  | "FREE_GRANT";
  startDate: string;
  endDate: string;
  plan: SubscriptionPlanFromApi;
  maxAmount: number | null;
  frequency: string | null;
  currency: string | null;
  paymentOrderId: string | null;
}

interface SubscriptionResponse {
  message: string;
  hasActiveSubscription: boolean;
  currentSubscription: CurrentSubscription | null;
  currentPlan: SubscriptionPlanFromApi | null;
  grantedByProgram: GrantedByProgram | null;
  userType: "ENTHUSIAST" | "COACH" | "SOLOPRENEUR";
  membership: "PAID" | "FREE";
}

/* ---------------- MAIN PAGE ---------------- */

const SubscriptionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data, isLoading, isError, error } = useQuery<
    SubscriptionResponse,
    AxiosError
  >({
    queryKey: ["currentSubscription"],
    queryFn: async () => {
      const res = await axios.get("/api/user/get-subscription");
      return res.data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: allPlans } = useQuery({
    queryKey: ["all-plans"],
    queryFn: async () => {
      const res = await axios.get("/api/subscription-plans");
      return res.data;
    },
  });
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");
  const type = searchParams.get("type");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const isCurrentPlan = (plan: SubscriptionPlanFromApi) => {
    // FREE coach/solopreneur — highlight the FREE tier card
    if (!currentSubscription && (userType === "COACH" || userType === "SOLOPRENEUR")) {
      return plan.interval === "FREE";
    }

    if (!currentSubscription) return false;

    return (
      plan.id === currentSubscription.planId ||
      plan.interval === currentPlan?.interval
    );
  };
  const userType = session?.user?.userType;
  const membership = data?.membership;

  const currentSubscription = data?.currentSubscription;
  const currentPlan = data?.currentPlan;
  const grantedByProgram = data?.grantedByProgram;

  const hasSubscription = data?.hasActiveSubscription;
  console.log({
    currentSubscription,
    currentPlan,
    hasSubscription,
    grantedByProgram,
  });

  const isEnthusiast = userType === "ENTHUSIAST";

  // const isCancellable =
  //   hasSubscription &&
  //   currentPlan?.interval !== "LIFETIME" &&
  //   currentSubscription?.status === "ACTIVE";

  const isCancellationPending =
    currentSubscription?.status === "CANCELLATION_PENDING";

  const isFreeGrant = currentSubscription?.status === "FREE_GRANT";

  // const cancelMutation = useMutation({
  //   mutationFn: async () => {
  //     const res = await axios.post("/api/user/cancel-subscription");
  //     return res.data;
  //   },
  //   onSuccess: () => {
  //     toast.success(
  //       "Subscription successfully marked for cancellation. Your access will continue until the expiration date."
  //     );
  //     queryClient.invalidateQueries({ queryKey: ["currentSubscription"] });
  //   },
  //   onError: (err) => toast.error(getAxiosErrorMessage(err)),
  // });

  // Helper to format currency and amount
  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount || !currency) return "N/A";
    try {

      return amount.toLocaleString(undefined, {
        style: "currency",
        currency: currency,
      });
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  // AFTER
  const filteredPlans: SubscriptionPlanFromApi[] = (allPlans as SubscriptionPlanFromApi[] ?? [])
    .filter((p) => {
      if (userType === "ENTHUSIAST") {
        return p.userType === "ENTHUSIAST";
      }
      return p.userType === "COACH" || p.userType === "SOLOPRENEUR";
    })
    .sort((a, b) => a.amountUSD - b.amountUSD);


  const router = useRouter();


  useEffect(() => {
    if (!pid || type !== "membership") return;

    // Start verifying
    setVerifying(true);
    setVerified(false);

    let retries = 0;
    const MAX_RETRIES = 10;
    let timer: NodeJS.Timeout;

    const verify = async () => {
      try {
        const res = await axios.get("/api/billing/verify-success", {
          params: { pid, type },
          withCredentials: true,
          validateStatus: () => true,
        });

        if (res.status === 200 && res.data?.ok) {
          // Refetch subscription data now that payment is confirmed
          queryClient.invalidateQueries({ queryKey: ["currentSubscription"] });
          setVerified(true);
          setVerifying(false);
          const membership = res.data?.membership;
          const planName = membership?.planName ?? "your plan";
          const endDate = membership?.endDate
            ? format(new Date(membership.endDate), "MMMM d, yyyy")
            : null;

          toast.success(
            `🎉 Payment Successful! ${planName} is now active.${endDate ? ` Valid till: ${endDate}` : ""}`
          );
          // Clean URL
          const params = new URLSearchParams(searchParams.toString());
          params.delete("type");
          params.delete("pid");
          router.replace(`?${params.toString()}`, { scroll: false });
          return;
        }

        if (res.status === 202 || res.data?.pending) {
          retries++;
          if (retries <= MAX_RETRIES) {
            timer = setTimeout(verify, 2000);
          } else {
            setVerifying(false);
          }
          return;
        }

        setVerifying(false);
      } catch {
        retries++;
        if (retries <= MAX_RETRIES) {
          timer = setTimeout(verify, 2000);
        } else {
          setVerifying(false);
        }
      }
    };

    timer = setTimeout(verify, 2000);
    return () => clearTimeout(timer);
  }, [pid, type]);

  const getPlanLevel = (planInterval: PlanInterval) => {
    // FREE coach — treat FREE as their current level
    const currentPriority = currentSubscription
      ? (PLAN_PRIORITY[currentPlan?.interval as PlanInterval] ?? PLAN_PRIORITY.FREE)
      : (userType === "COACH" || userType === "SOLOPRENEUR")
        ? PLAN_PRIORITY.FREE
        : null;

    if (currentPriority === null) return 1; // unauthenticated or enthusiast fallback

    if (PLAN_PRIORITY[planInterval] < currentPriority) return -1;
    else if (PLAN_PRIORITY[planInterval] === currentPriority) return 0;
    else return 1;
  };

  const isBestValuePlan = (planInterval: PlanInterval) => {
    if (!session?.user) return planInterval === "YEARLY";
    if (userType === "ENTHUSIAST") return false;
    const currentPriority = PLAN_PRIORITY[currentPlan?.interval as PlanInterval] ?? PLAN_PRIORITY.FREE;
    return planInterval === "YEARLY" && PLAN_PRIORITY[planInterval] > currentPriority;
  };

  // Show verification card while pid is present and not yet verified
  if (verifying || (pid && type === "membership" && !verified)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-xl border-none">

          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              Verifying Payment
            </h2>
            <p className="text-slate-600 text-sm">
              We're confirming your purchase and activating your subscription.
              This may take a few seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (isLoading) return <PageSkeleton type="subscription" />;

  if (isError)
    return (
      <div className="text-center text-red-600 p-8">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
        {getAxiosErrorMessage(error)}
      </div>
    );

  return (
    <div className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ---------------- HEADER ---------------- */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold">
            Manage Your Subscription
          </h1>
          <p className="text-gray-600 text-lg mt-3">
            View your current plan and user designation.
          </p>
        </div>

        {/* ---------------- USER STATUS (RESPONSIVE UPDATE) ---------------- */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 sm:p-6 rounded-lg shadow-md mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            {/* LEFT SIDE */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold flex items-center flex-wrap">
                <Star className="w-5 h-5 text-indigo-500 mr-2" />
                Your Current Status
              </h3>

              <p className="flex items-start text-sm sm:text-base mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                <span className="break-words">
                  You are designated as <strong>{userType}</strong> user.
                </span>
              </p>
              {grantedByProgram && (
                <p className="mt-2 font-semibold break-words">
                  <span className="text-indigo-600">Program Enrollment:</span>{" "}
                  You are enrolled in the {" "}
                  {grantedByProgram.name}
                </p>
              )}

              {currentPlan && (
                <p className="mt-2 font-semibold break-words">
                  <span className="text-indigo-600">Plan:</span>{" "}
                  {currentPlan.name}
                </p>
              )}

              {/* DISPLAY MANDATE/RECURRING DETAILS HERE */}
              {currentSubscription &&
                currentPlan?.interval !== "LIFETIME" &&
                currentSubscription.mandateId && ( // ONLY show if it's a recurring paid subscription
                  <div className="mt-2 text-sm space-y-1 text-gray-700">
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 text-green-600 mr-2" />
                      <span>
                        Max Billing Amount:
                        <strong className="ml-1">
                          {formatAmount(
                            currentSubscription.maxAmount,
                            currentSubscription.currency
                          )}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Repeat className="w-3 h-3 text-indigo-600 mr-2" />
                      <span>
                        Billing Frequency:
                        <strong className="ml-1">
                          {currentSubscription.frequency}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              {/* END MANDATE/RECURRING DETAILS */}

              {/* {currentSubscription?.endDate &&
                  currentPlan?.interval !== "LIFETIME" && (
                    <p className="mt-2 text-xs flex items-center break-words">
                      <Calendar className="w-3 h-3 mr-2" />
                    
                      {currentSubscription.mandateId
                        ? "Renews on "
                        : "Expires on "}
                      <strong className="ml-1">
                        {format(
                          new Date(currentSubscription.endDate),
                          "MMMM d, yyyy"
                        )}
                      </strong>
                    </p>
                  )} */}

              {currentPlan?.interval === "LIFETIME" && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  Lifetime Access
                </p>
              )}

              {/* 👇 New block for FREE_GRANT status indication */}
              {isFreeGrant && (
                <p className="text-sm font-medium text-blue-700 mt-2 flex items-center">
                  <Gift className="w-4 h-4 mr-2 text-blue-500" />
                  This is a complimentary 1-year subscription granted through your enrollment in the {grantedByProgram?.name}.
                </p>
              )}
            </div>

            {/* RIGHT SIDE BUTTONS (Remains mostly unchanged) */}
            <div className="flex flex-row md:flex-col gap-3">
              {/* {isCancellable && (
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center disabled:bg-gray-400"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-2" />
                    )}
                    {cancelMutation.isPending
                      ? "Processing..."
                      : "Close Subscription"}
                  </button>
                )} */}

              {isCancellationPending && (
                <span className="py-2 px-4 bg-yellow-600 text-white rounded-lg text-sm font-semibold text-center">
                  Cancellation Pending
                </span>
              )}

              {currentPlan?.interval === "LIFETIME" && (
                <span className="py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-semibold text-center">
                  LIFETIME ACCESS
                </span>
              )}
            </div>
          </div>

          {/* Dedicated warning box for cancellation pending */}
          {isCancellationPending && currentSubscription?.endDate && (
            <div className="mt-4 p-3 bg-yellow-200 border-l-4 border-yellow-500 text-yellow-800 rounded-md">
              <p className="text-sm font-medium">
                Your subscription is marked for cancellation. Your access will
                expire on
                <strong>
                  {" "}
                  {format(
                    new Date(currentSubscription.endDate),
                    "MMMM d, yyyy"
                  )}
                </strong>
                .
              </p>
            </div>
          )}
        </div>



        {/* ---------------- ENTHUSIAST FREE INFO ---------------- */}
        {isEnthusiast && membership === "FREE" && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg shadow text-red-700 mb-10">
            <h3 className="font-bold text-lg">You are not a paid member</h3>
            <p className="text-sm mt-1">
              Enthusiasts do not have a free plan. Please purchase the
              <strong> Yearly Self-Growth Enthusiast Subscription</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start mb-12">
          {filteredPlans?.map((p: SubscriptionPlanFromApi) => {
            const isCurrent = isCurrentPlan(p);
            const isBestValue = isBestValuePlan(p.interval);
            const badgeText = isCurrent ? "Current Plan" : isBestValue ? "BEST VALUE" : null;
            const level = getPlanLevel(p.interval);

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-6 shadow-sm text-center flex flex-col h-full bg-white dark:bg-slate-900 transition-all hover:shadow-md
            ${isCurrent
                    ? "border-2 border-green-600 ring-4 ring-green-600/10 z-10 transform sm:-translate-y-2"
                    : isBestValue
                      ? "border-2 border-blue-600 ring-4 ring-blue-600/10 z-10 transform sm:-translate-y-2"
                      : "border border-slate-200 dark:border-slate-800"
                  }`}
              >
                {/* Badge */}
                {badgeText && (
                  <div
                    className={`absolute -top-[2px] -right-[2px] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase z-20
                ${isCurrent ? "bg-green-600" : "bg-blue-600"}`}
                  >
                    {badgeText}
                  </div>
                )}

                {/* Plan Name */}
                <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">
                  {p.name.replace(" Pro", "").replace("Tier", "")}
                </h4>

                {/* Price */}
                <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  ₹{p.amountINR} + GST
                  {p.interval !== "LIFETIME" && p.amountUSD > 0 && (
                    <span className="text-sm font-medium text-slate-700 ml-1">
                      /{p.interval === "MONTHLY" ? "month" : "year"}
                    </span>
                  )}
                  {p.interval === "LIFETIME" && (
                    <span className="block text-sm font-medium text-slate-500 mt-1">One-time</span>
                  )}
                  {p.amountUSD > 0 && (
                    <span className="block text-sm font-medium text-slate-400 mt-2">
                      or ${p.amountUSD} /{p.interval === "MONTHLY" ? "month" : p.interval === "YEARLY" ? "year" : "one-time"}
                    </span>
                  )}
                </p>

                {/* Features */}
                <div className="flex-grow mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <ul className="space-y-3 text-sm text-left">
                    {p.features?.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                        <span className="text-slate-600 dark:text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                {/* Button */}
                {isEnthusiast && membership === "FREE" ? (
                  <button
                    onClick={() => router.push(`/dashboard/membership/checkout?context=SUBSCRIPTION&plan=${p.id}`)}
                    className="mt-8 w-full py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                  >
                    Start Annual Membership
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (level !== 0 && !(level === -1 && getPlanLevel("LIFETIME" as PlanInterval) === 0)) {
                        router.push(`/dashboard/membership/checkout?context=SUBSCRIPTION&plan=${p.id}`);
                      }
                    }}
                    disabled={level === 0 || (level === -1 && currentPlan?.interval === "LIFETIME")}
                    className={`mt-8 w-full py-3 rounded-xl text-sm font-bold text-white transition-all
      ${isCurrent
                        ? "bg-green-600 cursor-not-allowed"
                        : level === -1 && currentPlan?.interval === "LIFETIME"
                          ? ""
                          : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                      }`}
                  >
                    {level === -1 ? "Switch to Lower Plan" : level === 0 ? "Current Plan" : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* ---------------- END PLAN CARD GRID ---------------- */}

      </div>
    </div>
  );
};

export default SubscriptionPage;

// pricing adding 