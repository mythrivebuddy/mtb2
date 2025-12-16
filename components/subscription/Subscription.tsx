"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Gift, // New Icon for Free Grant/Program
} from "lucide-react";
import { toast } from "sonner";
import PageSkeleton from "../PageSkeleton";
import { useSession } from "next-auth/react";
import { getAxiosErrorMessage } from "@/utils/ax";

/* --------------------- API TYPES ---------------------- */

interface SubscriptionPlanFromApi {
  id: string;
  name: string;
  userType: string;
  interval: string;
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

/* ---------------- PLAN CARDS ---------------- */

const UserPlanCard: React.FC<{
  plan: SubscriptionPlanFromApi;
  startDate?: string | null;
  endDate?: string | null;
  status: CurrentSubscription["status"];
}> = ({ plan, startDate, endDate, status }) => {
  const features = plan.features ?? [];

  const isPendingCancel = status === "CANCELLATION_PENDING";

  return (
    <div className="bg-white border border-indigo-200 rounded-xl shadow-lg p-6 flex flex-col w-full">
      <h2 className="text-2xl font-bold text-gray-900 text-center break-words">
        {plan.name}
      </h2>

      <p className="text-center text-gray-600 text-lg mt-1">
        {plan.interval === "LIFETIME"
          ? "Lifetime Access"
          : plan.interval === "MONTHLY"
            ? "Monthly Subscription"
            : plan.interval === "YEARLY"
              ? "Yearly Subscription"
              : plan.interval}
      </p>

      {startDate && (
        <p className="text-sm text-gray-500 text-center mt-1">
          Started on {format(new Date(startDate), "MMMM d, yyyy")}
        </p>
      )}
      {
        endDate && (
          <p className="text-sm text-gray-500 text-center mt-1">
            Expires on {format(new Date(endDate), "MMMM d, yyyy")}
          </p>
        )
      }

      {isPendingCancel && (
        <div className="mt-4 p-2 text-center bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium">
          Cancellation pending. Access until{" "}
          {format(new Date(endDate || new Date()), "MMMM d, yyyy")}
        </div>
      )}

      <ul className="space-y-3 mt-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start text-sm text-gray-700">
            <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0" />
            <span className="break-words">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FreePlanCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col w-full">
    <h2 className="text-2xl font-bold text-gray-900 text-center">Free Plan</h2>
    <p className="text-center text-gray-600 text-lg mt-2">$0 forever</p>

    <ul className="space-y-3 mt-6">
      {[
        "Host 1 Challenge Per Month",
        "No Listing on “Challenges” page",
        "Listing on “Solopreneurs of the Day” page",
        "No Listing on “Webinars” page (coming soon)",
        "Earn JoyPearls on every activity",
        "List 1 Product on the store (Zero commission on sales)",
        "Redeem JoyPearls for Spotlights on MTB homepage, newsletter, challenges",
        "Redeem JoyPearls for Spotlights with other members",
      ].map((feature) => (
        <li key={feature} className="flex items-start text-sm text-gray-700">
          <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" />
          <span className="break-words">{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

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
  const isCoachOrSolo = userType === "COACH" || userType === "SOLOPRENEUR";

  const isCancellable =
    hasSubscription &&
    currentPlan?.interval !== "LIFETIME" &&
    currentSubscription?.status === "ACTIVE";

  const isCancellationPending =
    currentSubscription?.status === "CANCELLATION_PENDING";

  const isFreeGrant = currentSubscription?.status === "FREE_GRANT";

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/user/cancel-subscription");
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        "Subscription successfully marked for cancellation. Your access will continue until the expiration date."
      );
      queryClient.invalidateQueries({ queryKey: ["currentSubscription"] });
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

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
              {isCancellable && (
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
              )}

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

        {/* ---------------- PLAN CARD GRID (RESPONSIVE UPDATE) ---------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* 1. ENTHUSIAST PAID */}
          {isEnthusiast &&
            membership === "PAID" &&
            currentPlan &&
            currentSubscription && (
              <UserPlanCard
                plan={currentPlan}
                startDate={currentSubscription.startDate}
                endDate={currentSubscription.endDate}
                status={currentSubscription.status}
              />
            )}

          {/* 2. COACH/SOLO PAID: Show UserPlanCard */}
          {isCoachOrSolo &&
            membership === "PAID" &&
            currentPlan &&
            currentSubscription && (
              <UserPlanCard
                plan={currentPlan}
                startDate={currentSubscription.startDate}
                endDate={currentSubscription.endDate}
                status={currentSubscription.status}
              />
            )}

          {/* 3. COACH/SOLO FREE: Show FreePlanCard */}
          {isCoachOrSolo && membership === "FREE" && <FreePlanCard />}

          {/* Note: ENTHUSIAST FREE is handled above with a warning box, no card needed here */}
        </div>
        {/* ---------------- END PLAN CARD GRID ---------------- */}

        {userType !== "ENTHUSIAST" && (
          <>
            {/* ---------------- DO NOT TOUCH BELOW THIS ---------------- */}
            <p className="text-center text-gray-500 italic mt-4">
              *Features Coming soon
            </p>

            {/* Lifetime pricing section below remains unchanged */}
            {/* -------------------------------------------------------- */}
            <div className="mt-12 bg-gradient-to-r from-indigo-800 to-blue-900 text-white rounded-xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold">
                  Invest Once, Thrive Forever
                </h2>
                <p className="text-lg mt-2">Grab Your Lifetime Plan Now!</p>
                <div className="inline-flex items-center bg-indigo-500 text-white text-sm font-semibold px-3 py-1 mt-3 rounded-full">
                  <Star className="w-4 h-4 mr-1" />
                  Recommended
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Pricing Table */}
                <div className="flex-1 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-indigo-400">
                        <th className="px-4 py-3 text-left font-semibold text-indigo-100">
                          Range
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-indigo-100">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-indigo-100">
                          Tagline
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          range: "1-10",
                          price: "$499",
                          tagline: "Early Bird Gets The Best Deal!",
                        },
                        {
                          range: "11-20",
                          price: "$699",
                          tagline: "Still Early — Save Big!",
                        },
                        {
                          range: "21-30",
                          price: "$999",
                          tagline: "Almost Half Gone – Act Fast!",
                        },
                        {
                          range: "31-40",
                          price: "$1399",
                          tagline: "Last Few Spots Left!",
                        },
                        {
                          range: "41-50",
                          price: "$1899",
                          tagline: "Final Chance At This Offer!",
                        },
                        { range: "Standard", price: "$2999", tagline: "" },
                      ].map((item, index) => (
                        <tr
                          key={index}
                          className="text-indigo-300 hover:bg-indigo-700/30 transition-colors duration-200"
                        >
                          <td className="px-4 py-3">{item.range}</td>
                          <td className="px-4 py-3">{item.price}</td>
                          <td className="px-4 py-3">{item.tagline}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Limited Offer Box */}
                <div className="lg:w-[250px] bg-white text-indigo-900 rounded-lg p-6 flex flex-col items-center justify-center shadow-inner">
                  <h3 className="text-xl font-bold mb-3">Limited Offer</h3>
                  <p className="text-red-500 font-semibold mb-4 text-center">
                    Early Bird Gets The Best Deal!
                  </p>
                  <div className="text-2xl font-bold mb-4">0/10</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
