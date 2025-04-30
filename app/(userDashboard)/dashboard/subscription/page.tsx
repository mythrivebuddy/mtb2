"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Check, Loader2, Info, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";

interface Plan {
  id: string;
  name: string;
  jpMultiplier: number;
  discountPercent: number;
  durationDays: number | null;
  price: string;
  paypalPlanId: string;
  paypalProductId: string;
}

interface LifetimeTier {
  tier: string;
  planId: string;
  planName: string;
  price: string;
  paypalPlanId: string;
  userRange: string;
}

interface CurrentLifetimePlan {
  planId: string;
  planName: string;
  price: string;
  paypalPlanId: string;
}

interface SubscriptionData {
  currentPlan: Plan | null;
  planStart: string | null;
  planEnd: string | null;
  hasActiveSubscription: boolean;
  plans: Plan[];
  currentLifetimePlan: CurrentLifetimePlan;
  lifetimePlanUsers?: number;
  limitedOfferAvailable?: boolean;
  lifetimeTiers: LifetimeTier[];
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  price: string;
  paypalPlanId: string;
  isSubscription: boolean;
  onSuccess: (paidAmount: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  price,
  paypalPlanId,
  isSubscription,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Complete Your Subscription</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            You&apos;re subscribing to the{" "}
            <span className="font-medium">{plan.name}</span>
          </p>
          <div className="text-lg font-bold mt-2">
            <span>Total: ${price}</span>
            {isSubscription && (
              <span> /{plan.name.includes("Monthly") ? "month" : "year"}</span>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="flex justify-center items-center my-4 py-2 bg-gray-50 rounded-md">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
            <span className="text-gray-700">Processing payment...</span>
          </div>
        )}

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PP_CLIENT_ID || "",
            intent: isSubscription ? "subscription" : "capture",
            components: "buttons",
            currency: "USD",
            vault: true,
            debug: process.env.NODE_ENV !== "production",
          }}
        >
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: isSubscription ? "subscribe" : "pay",
            }}
            disabled={isProcessing}
            forceReRender={[price, paypalPlanId, isSubscription]}
            createOrder={
              isSubscription
                ? undefined
                : (_, actions) => {
                    console.log(paypalPlanId);
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: {
                            value: price,
                            currency_code: "USD",
                          },
                          description: `Subscription to ${plan.name}`,
                        },
                      ],
                      application_context: {
                        shipping_preference: "NO_SHIPPING",
                      },
                    });
                  }
            }
            createSubscription={
              isSubscription
                ? (_, actions) => {
                    console.log(paypalPlanId);
                    return actions.subscription.create({
                      plan_id: paypalPlanId,
                      custom_id: `SUB-${plan.id}-${Date.now()}`,
                    });
                  }
                : undefined
            }
            onApprove={async (data, actions) => {
              setIsProcessing(true);
              try {
                let paidAmount: string;
                if (isSubscription) {
                  const details = await actions.subscription?.get();
                  if (!details) {
                    throw new Error("Failed to capture subscription");
                  }
                  paidAmount = price; // Use the plan price for subscriptions
                  const subscriptionId = details.id;
                  const res = await axios.post("/api/user/subscription/create",{subscriptionId});
                  if(!res){
                    throw new Error("Failed to update subscription in database");
                  }
                  console.log("Subscription created:", details);
                } else {
                  const details = await actions.order?.capture();
                  if (!details || !details.purchase_units?.[0]?.amount?.value) {
                    throw new Error("Failed to capture payment");
                  }
                  paidAmount = details.purchase_units[0].amount.value;
                  console.log("Payment captured:", details);
                }
                await onSuccess(paidAmount);
                toast.success(
                  "Payment successful! Your subscription has been activated."
                );
              } catch (error: unknown) {
                console.error("Payment processing error:", error);
                if (
                  error instanceof Error &&
                  error.message.includes("Window closed")
                ) {
                  toast.error("Payment window was closed. Please try again.");
                } else {
                  toast.error(
                    "Payment processing failed. Please try again or contact support."
                  );
                }
              } finally {
                setIsProcessing(false);
                onClose();
              }
            }}
            onError={(err) => {
              console.error("PayPal SDK error:", err);
              toast.error(
                "An error occurred with PayPal. Please try again or use a different payment method."
              );
            }}
            onCancel={() => {
              toast.info(
                "Payment cancelled. Your subscription was not processed."
              );
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  discount?: string;
  onSubscribe: () => void;
  isLoading: boolean;
  isCurrentPlan?: boolean;
  disabled?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  discount,
  onSubscribe,
  isLoading,
  isCurrentPlan,
  disabled = false,
}) => (
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
      {isCurrentPlan ? (
        "Current Plan"
      ) : disabled ? (
        "Not Available"
      ) : isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : (
        "Subscribe"
      )}
    </button>
  </div>
);

interface CurrentPlanStatusProps {
  currentPlan: Plan;
  planStart: string | null;
  planEnd: string | null;
}

const CurrentPlanStatus: React.FC<CurrentPlanStatusProps> = ({
  currentPlan,
  planStart,
  planEnd,
}) => {
  const planEndDate = planEnd ? new Date(planEnd) : null;

  return (
    <div className="bg-[#EDF2FF] rounded-lg p-4 mb-6 flex items-start">
      <Info className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
      <div>
        <h3 className="text-md font-medium">Your Current Subscription</h3>
        <p className="text-sm text-gray-600">
          You are currently subscribed to the{" "}
          <span className="font-medium">{currentPlan.name}</span>;
          {planStart && (
            <span> since {format(new Date(planStart), "MMMM d, yyyy")}</span>
          )}
          {planEndDate && (
            <span> until {format(planEndDate, "MMMM d, yyyy")}</span>
          )}
          {!planEndDate && currentPlan.name.startsWith("Lifetime Plan") && (
            <span> with no expiration</span>
          )}
        </p>
      </div>
    </div>
  );
};

const SubscriptionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedPaypalPlanId, setSelectedPaypalPlanId] = useState<string>("");
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await axios.get<SubscriptionData>(
        "/api/user/subscription"
      );
      return response.data;
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({
      planId,
      price,
    }: {
      planId: string;
      price: string;
    }) => {
      const response = await axios.post("/api/user/subscription", {
        planId,
        price,
      });
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

  const handleSubscribe = (
    planId: string,
    price: string,
    plan: Plan,
    paypalPlanId: string,
    isSub: boolean
  ) => {
    setSelectedPlan(plan);
    setSelectedPrice(price);
    setSelectedPaypalPlanId(paypalPlanId);
    setIsSubscription(isSub);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = async (paidAmount: string) => {
    if (!selectedPlan) {
      toast.error("No plan selected");
      return;
    }

    setIsSubscribing(true);
    try {
      await subscribeMutation.mutateAsync({
        planId: selectedPlan.id,
        price: paidAmount,
      });
      setIsModalOpen(false);
      setSelectedPlan(null);
      setSelectedPrice("");
      setSelectedPaypalPlanId("");
      setIsSubscription(false);
    } catch (error) {
      console.error("Failed to update subscription:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const monthlyPlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Monthly Plan"),
    [data?.plans]
  );

  const yearlyPlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Yearly Plan"),
    [data?.plans]
  );
  console.log(yearlyPlan);

  const lifetimeStandardPlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Lifetime Plan Standard"),
    [data?.plans]
  );
  console.log(lifetimeStandardPlan);

  if (isLoading) {
    return <PageLoader />;
  }

  const hasLifetimePlan = data?.currentPlan?.name.startsWith("Lifetime Plan");
  const hasActivePlan = data?.hasActiveSubscription && data?.currentPlan;

  // Filter lifetime tiers to show only current and future tiers
  const availableTiers = (data?.lifetimeTiers || []).sort(
    (a, b) => Number(a.price) - Number(b.price)
  );
  console.log("availableTiers:", availableTiers);

  const getDisabledStatus = (planName: string) => {
    if (!hasActivePlan) return false;

    const currentPlan = data.currentPlan?.name;

    if (currentPlan === "Lifetime Plan Standard") {
      // If user has Lifetime Plan, everything else is disabled
      return planName !== "Lifetime Plan Standard";
    }

    if (currentPlan === "Yearly Plan") {
      // If user has Yearly Plan, Monthly is disabled, Lifetime is available
      return planName === "Monthly Plan";
    }

    if (currentPlan === "Monthly Plan") {
      // If user has Monthly Plan, everything is available
      return false;
    }

    return false; // fallback
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg p-8">
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

        {hasActivePlan && data.currentPlan && (
          <CurrentPlanStatus
            currentPlan={data.currentPlan}
            planStart={data.planStart}
            planEnd={data.planEnd}
          />
        )}

        {/* Always show all three plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {monthlyPlan && (
            <PlanCard
              name="Monthly Plan"
              price={monthlyPlan.price}
              period="per month"
              onSubscribe={() =>
                handleSubscribe(
                  monthlyPlan.id,
                  monthlyPlan.price,
                  monthlyPlan,
                  monthlyPlan.paypalPlanId,
                  true
                )
              }
              isLoading={isSubscribing}
              isCurrentPlan={
                !!(hasActivePlan && data.currentPlan?.name === "Monthly Plan")
              }
              disabled={getDisabledStatus("Monthly Plan")}
            />
          )}
          {yearlyPlan && (
            <PlanCard
              name="Yearly Plan"
              price={yearlyPlan.price}
              period="per year"
              discount="Save 14%"
              onSubscribe={() =>
                handleSubscribe(
                  yearlyPlan.id,
                  yearlyPlan.price,
                  yearlyPlan,
                  yearlyPlan.paypalPlanId,
                  true
                )
              }
              isLoading={isSubscribing}
              isCurrentPlan={
                !!(hasActivePlan && data.currentPlan?.name === "Yearly Plan")
              }
              disabled={getDisabledStatus("Yearly Plan")}
            />
          )}
          {lifetimeStandardPlan && (
            <PlanCard
              name="Lifetime Plan"
              price={lifetimeStandardPlan.price}
              period="one-time payment"
              onSubscribe={() =>
                handleSubscribe(
                  lifetimeStandardPlan.id,
                  lifetimeStandardPlan.price,
                  lifetimeStandardPlan,
                  lifetimeStandardPlan.paypalPlanId,
                  false
                )
              }
              isLoading={isSubscribing}
              isCurrentPlan={
                !!(
                  hasActivePlan &&
                  data.currentPlan?.name === "Lifetime Plan Standard"
                )
              }
              disabled={getDisabledStatus("Lifetime Plan Standard")}
            />
          )}
        </div>

        {/* Show limited offer section only if lifetimePlanUsers < 50 */}
        {data?.limitedOfferAvailable && (
          <div className="bg-[#FFF7F7] shadow-md rounded-lg px-6 py-10 text-center mt-6">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5 text-jp-orange mr-2" />
              <h3 className="text-xl font-semibold text-jp-orange">
                Limited Lifetime Offer
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Only {50 - (data.lifetimePlanUsers || 0)} spots left at discounted
              rates! ({data.lifetimePlanUsers}/50 claimed)
            </p>
            <div className="mb-6">
              <table className="w-full text-left text-sm text-gray-600">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Tier</th>
                    <th className="py-2">User Range</th>
                    <th className="py-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {availableTiers.map((tier) => (
                    <tr
                      key={tier.tier}
                      className={`${
                        tier.planName === data.currentLifetimePlan.planName
                          ? "bg-jp-orange/10 font-semibold"
                          : "text-gray-400"
                      } hover:bg-gray-50`}
                    >
                      <td className="py-2">{tier.tier}</td>
                      <td className="py-2">{tier.userRange}</td>
                      <td className="py-2">${tier.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Only show claim button for the current tier */}
            {data.currentLifetimePlan && (
              <button
                onClick={() =>
                  handleSubscribe(
                    data.currentLifetimePlan.planId,
                    data.currentLifetimePlan.price,
                    data.plans.find(
                      (p) => p.id === data.currentLifetimePlan.planId
                    )!,
                    data.currentLifetimePlan.paypalPlanId,
                    false
                  )
                }
                disabled={isSubscribing}
                className="bg-[#FF6B6B] text-white rounded-lg px-8 py-2 hover:bg-[#FF6B6B]/90 transition-colors"
              >
                {isSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `Claim ${data.currentLifetimePlan.planName} for $${data.currentLifetimePlan.price}`
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedPlan && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlan(null);
            setSelectedPrice("");
            setSelectedPaypalPlanId("");
            setIsSubscription(false);
          }}
          plan={selectedPlan}
          price={selectedPrice}
          paypalPlanId={selectedPaypalPlanId}
          isSubscription={isSubscription}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
 