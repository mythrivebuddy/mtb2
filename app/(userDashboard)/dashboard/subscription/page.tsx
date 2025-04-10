"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format, differenceInDays } from "date-fns";
import { Check, Loader2, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import PageLoader from "@/components/PageLoader";

// Types
interface Plan {
  id: string;
  name: string;
  jpMultiplier: number;
  discountPercent: number;
  durationDays: number | null;
  price: string;
}

interface SubscriptionData {
  currentPlan: Plan | null;
  planStart: string | null;
  planEnd: string | null;
  hasActiveSubscription: boolean;
  plans: Plan[];
  lifetimePlanUsers?: number;
  limitedOfferAvailable?: boolean;
}

// Calculate prorated price for plan upgrades
const calculateProratedPrice = (
  currentPlan: Plan,
  newPlan: Plan,
  planStart: string | null
): number => {
  if (!currentPlan || !planStart) return parseFloat(newPlan.price);

  // If upgrading to lifetime, use a different calculation
  if (newPlan.durationDays === null) {
    const currentPrice = parseFloat(currentPlan.price);
    const newPrice = parseFloat(newPlan.price);

    // For monthly to lifetime
    if (currentPlan.durationDays === 30) {
      const daysUsed = differenceInDays(new Date(), new Date(planStart));
      const daysRemaining = currentPlan.durationDays - daysUsed;
      const refundAmount =
        (daysRemaining / currentPlan.durationDays) * currentPrice;
      return Math.max(0, newPrice - refundAmount);
    }

    // For yearly to lifetime
    if (currentPlan.durationDays === 365) {
      const daysUsed = differenceInDays(new Date(), new Date(planStart));
      const daysRemaining = currentPlan.durationDays - daysUsed;
      const refundAmount =
        (daysRemaining / currentPlan.durationDays) * currentPrice;
      return Math.max(0, newPrice - refundAmount);
    }

    return newPrice;
  }

  // If upgrading from monthly to yearly
  if (currentPlan.durationDays === 30 && newPlan.durationDays === 365) {
    const currentPrice = parseFloat(currentPlan.price);
    const newPrice = parseFloat(newPlan.price);
    const daysUsed = differenceInDays(new Date(), new Date(planStart));
    const daysRemaining = currentPlan.durationDays - daysUsed;
    const refundAmount =
      (daysRemaining / currentPlan.durationDays) * currentPrice;
    return Math.max(0, newPrice - refundAmount);
  }

  return parseFloat(newPlan.price);
};

// Regular Plan Card Component
const PlanCard = ({
  name,
  price,
  period,
  discount,
  onSubscribe,
  isLoading,
  isCurrentPlan,
  disabled = false,
}: {
  name: string;
  price: string;
  period: string;
  discount?: string;
  onSubscribe: () => void;
  isLoading: boolean;
  isCurrentPlan?: boolean;
  disabled?: boolean;
}) => {
  return (
    <div
      className={`bg-[#F1F3FF] shadow-md rounded-lg p-6 flex flex-col justify-between items-center h-full ${
        isCurrentPlan ? "border-2 border-[#151E46]" : ""
      }`}
    >
      <div className="w-full flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        {isCurrentPlan && (
          <div className="bg-[#151E46] text-white text-xs px-3 py-1 rounded-full mb-3 flex items-center">
            <Check className="w-3 h-3 mr-1" /> Current Plan
          </div>
        )}
        <div className="flex items-baseline mb-2">
          <span className="text-lg">$</span>
          <span className="text-2xl font-bold">{price} </span>
        </div>
        <div>
          {(period || discount) && (
            <span className="text-sm text-gray-600 mb-4">
              {` ${period}`}
              {discount && ` (${discount})`}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onSubscribe}
        disabled={isLoading || disabled || isCurrentPlan}
        className={`w-full rounded-md py-2 transition-colors mt-4 ${
          isCurrentPlan || disabled
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-[#151E46] text-white hover:bg-[#14162F]/90"
        }`}
      >
        {isCurrentPlan
          ? "Current Plan"
          : disabled
          ? "Not Available"
          : "Subscribe"}
      </button>
    </div>
  );
};

// Current Plan Status Component
const CurrentPlanStatus = ({
  currentPlan,
  planStart,
  planEnd,
}: {
  currentPlan: Plan;
  planStart: string | null;
  planEnd: string | null;
}) => {
  const planEndDate = planEnd ? new Date(planEnd) : null;

  return (
    <div className="bg-[#EDF2FF] rounded-lg p-4 mb-6 flex items-start">
      <Info className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
      <div>
        <h3 className="text-md font-medium">Your Current Subscription</h3>
        <p className="text-sm text-gray-600">
          You are currently subscribed to the{" "}
          <span className="font-medium">{currentPlan.name}</span>
          {planStart && (
            <span> since {format(new Date(planStart), "MMMM d, yyyy")}</span>
          )}
          {planEndDate && (
            <span> until {format(planEndDate, "MMMM d, yyyy")}</span>
          )}
          {!planEndDate && currentPlan.name === "Lifetime Plan" && (
            <span> with no expiration</span>
          )}
        </p>
      </div>
    </div>
  );
};

// Main Subscription Page Component
const SubscriptionPage = () => {
  const queryClient = useQueryClient();
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Fetch subscription data
  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await axios.get("/api/user/subscription");
      return response.data;
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await axios.post("/api/user/subscription", { planId });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Subscription updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error));
    },
  });

  // Handle subscription
  const handleSubscribe = async (planId: string) => {
    setIsSubscribing(true);
    try {
      await subscribeMutation.mutateAsync(planId);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Find plans by name
  const monthlyPlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Monthly Plan"),
    [data?.plans]
  );

  const yearlyPlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Yearly Plan"),
    [data?.plans]
  );

  const lifetimePlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Lifetime Plan"),
    [data?.plans]
  );

  // Calculate prorated prices for upgrades if user has an active subscription
  const proratedYearlyPrice = useMemo(() => {
    if (
      data?.currentPlan &&
      data.currentPlan.name === "Monthly Plan" &&
      data.planStart &&
      yearlyPlan
    ) {
      const price = calculateProratedPrice(
        data.currentPlan,
        yearlyPlan,
        data.planStart
      );
      return price.toFixed(2);
    }
    return yearlyPlan?.price || "299";
  }, [data?.currentPlan, data?.planStart, yearlyPlan]);

  const proratedLifetimePrice = useMemo(() => {
    if (data?.currentPlan && data.planStart && lifetimePlan) {
      const price = calculateProratedPrice(
        data.currentPlan,
        lifetimePlan,
        data.planStart
      );
      return price.toFixed(2);
    }
    return lifetimePlan?.price || "2999";
  }, [data?.currentPlan, data?.planStart, lifetimePlan]);

  if (isLoading) {
    return <PageLoader />;
  }

  // Check if user is on lifetime plan
  const hasLifetimePlan = data?.currentPlan?.name === "Lifetime Plan";

  // Check if user has any active plan
  const hasActivePlan = data?.hasActiveSubscription && data?.currentPlan;

  return (
    <div className="w-full mt-5">
      {/* Main Content */}
      <div className="bg-white rounded-lg p-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {hasActivePlan
              ? hasLifetimePlan
                ? "You Have Lifetime Access"
                : "Upgrade Your Plan"
              : "Unlock Unlimited JoyPearls 🚀"}
          </h2>
          <p className="text-gray-600">
            {hasActivePlan
              ? hasLifetimePlan
                ? "You have unlimited access to all premium features with your Lifetime plan."
                : "Choose an upgrade option below to get more value and features."
              : "Choose the membership that suits you best and start enjoying unlimited JoyPearls to unlock all premium features."}
          </p>
        </div>

        {/* Current Plan Status */}
        {hasActivePlan && data.currentPlan && (
          <CurrentPlanStatus
            currentPlan={data.currentPlan}
            planStart={data.planStart}
            planEnd={data.planEnd}
          />
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly Plan */}
          {(!hasActivePlan || data?.currentPlan?.name !== "Monthly Plan") &&
            data?.currentPlan?.name !== "Yearly Plan" &&
            !hasLifetimePlan &&
            monthlyPlan && (
              <PlanCard
                name="Monthly Plan"
                price={monthlyPlan.price}
                period="per month"
                onSubscribe={() => handleSubscribe("monthly")}
                isLoading={isSubscribing}
                disabled={hasLifetimePlan}
              />
            )}

          {/* Show current Monthly Plan */}
          {data?.currentPlan?.name === "Monthly Plan" && (
            <PlanCard
              name="Monthly Plan"
              price={data.currentPlan.price}
              period="per month"
              onSubscribe={() => {}}
              isLoading={false}
              isCurrentPlan={true}
            />
          )}

          {/* Yearly Plan */}
          {(!hasActivePlan || data?.currentPlan?.name !== "Yearly Plan") &&
            !hasLifetimePlan &&
            yearlyPlan && (
              <PlanCard
                name="Yearly Plan"
                price={
                  data?.currentPlan?.name === "Monthly Plan"
                    ? proratedYearlyPrice
                    : yearlyPlan.price
                }
                period="per year"
                discount={
                  data?.currentPlan?.name !== "Monthly Plan"
                    ? "Save 20%"
                    : "Prorated price"
                }
                onSubscribe={() => handleSubscribe("yearly")}
                isLoading={isSubscribing}
                disabled={hasLifetimePlan}
              />
            )}

          {/* Show current Yearly Plan */}
          {data?.currentPlan?.name === "Yearly Plan" && (
            <PlanCard
              name="Yearly Plan"
              price={data.currentPlan.price}
              period="per year"
              discount="Save 20%"
              onSubscribe={() => {}}
              isLoading={false}
              isCurrentPlan={true}
            />
          )}

          {/* Lifetime Plan */}
          {!hasLifetimePlan && lifetimePlan && (
            <PlanCard
              name="Lifetime Plan"
              price={hasActivePlan ? proratedLifetimePrice : lifetimePlan.price}
              period="one-time payment"
              discount={hasActivePlan ? "Prorated price" : undefined}
              onSubscribe={() => handleSubscribe("lifetime")}
              isLoading={isSubscribing}
            />
          )}

          {/* Show current Lifetime Plan */}
          {hasLifetimePlan && lifetimePlan && (
            <PlanCard
              name="Lifetime Plan"
              price={data?.currentPlan?.price || "2999"}
              period="one-time payment"
              onSubscribe={() => {}}
              isLoading={false}
              isCurrentPlan={true}
            />
          )}
        </div>

        {/* Limited Offer Section */}
        {!hasLifetimePlan && data?.limitedOfferAvailable && (
          <div className="bg-[#FFF7F7] shadow-md rounded-lg px-6 py-10 text-center mt-6">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-jp-orange mr-2" />
              <h3 className="text-xl font-semibold text-jp-orange">
                Limited Offer
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              $499 for first 10 Lifetime members ({data.lifetimePlanUsers}/10
              spots claimed)
            </p>
            <button
              onClick={() => handleSubscribe("lifetime-limited")}
              disabled={isSubscribing}
              className="bg-[#FF6B6B] text-white rounded-lg px-8 py-2 hover:bg-[#FF6B6B]/90 transition-colors"
            >
              {isSubscribing ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Claim Your Spot"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
