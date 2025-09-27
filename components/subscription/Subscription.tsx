"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Loader2, Info, X, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getAxiosErrorMessage } from "@/utils/ax";
import PageSkeleton from "../PageSkeleton";
import {
  PaymentModalProps,
  Plan,
  SubscriptionData,
} from "@/types/client/subscription";

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto px-4 sm:px-6 transition-opacity duration-300">
      <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md md:max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Complete Your Subscription
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-sm sm:text-base">
            You are subscribing to the{" "}
            <span className="font-semibold text-gray-800">{plan.name}</span>
          </p>
          <div className="text-lg sm:text-xl font-bold mt-3 text-gray-900">
            <span>Total: ${price}</span>
            {isSubscription && (
              <span className="text-gray-600">
                {" "}
                /{plan.name.includes("Monthly") ? "month" : "year"}
              </span>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="flex justify-center items-center my-4 py-3 bg-gray-100 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-600" />
            <span className="text-gray-700 text-sm sm:text-base">
              Processing payment...
            </span>
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
                  paidAmount = price;
                  const subscriptionId = details.id;
                  const res = await axios.post(
                    "/api/user/subscription/create",
                    { subscriptionId }
                  );
                  if (!res) {
                    throw new Error(
                      "Failed to update subscription in database"
                    );
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-8 shadow-sm">
      <div className="flex items-start">
        <Info className="text-blue-600 mr-3 mt-1 flex-shrink-0 w-5 h-5" />
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Your Current Subscription
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            You are currently subscribed to the{" "}
            <span className="font-semibold text-gray-800">
              {currentPlan.name}
            </span>
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

  const lifetimeStandardPlan = useMemo(
    () => data?.plans.find((plan) => plan.name === "Lifetime Plan Standard"),
    [data?.plans]
  );

  if (isLoading) {
    return <PageSkeleton type="subscription" />;
  }

  const hasActivePlan = data?.hasActiveSubscription && data?.currentPlan;

  const availableTiers = (data?.lifetimeTiers || [])
    .filter((tier) => tier.planName !== "Lifetime Plan Standard")
    .sort((a, b) => Number(a.price) - Number(b.price));

  const getDisabledStatus = (planName: string) => {
    if (!hasActivePlan) return false;

    const currentPlan = data.currentPlan?.name;

    if (currentPlan === "Lifetime Plan Standard") {
      return planName !== "Lifetime Plan Standard";
    }

    if (currentPlan === "Yearly Plan") {
      return planName === "Monthly Plan";
    }

    if (currentPlan === "Monthly Plan") {
      return false;
    }

    return false;
  };

  const currentTierIndex = availableTiers.findIndex(
    (tier) => tier.planId === data?.currentLifetimePlan.planId
  );

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Intro Section */}
        <div className="text-center mb-16 px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            MyThriveBuddy.com Isn’t Just a Platform — It’s a Growth Ecosystem.
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
            <p>
              Most platforms give you tools to run your business.
              <br />
              MyThriveBuddy gives you Growth Tools and Growth Buddies.
            </p>
            <p className="text-xl font-bold text-gray-800">What if...</p>
            <p>
              Thousands of like-hearted solopreneurs were cheering for you,
              spotlighting your work, and even sending business your way?
            </p>
            <p className="text-xl font-bold text-gray-800">Imagine this:</p>
            <p>
              You’re not endlessly churning out content.
              <br />
              You’re not spamming Zoom links in dozens of WhatsApp groups.
              <br />
              And yet — your next client still finds you.
            </p>
            <p className="text-gray-700">
              That’s the power of <strong>Growth Buddies</strong>.
            </p>
            <p>
              Solopreneurs and members joining your challenges, spotlighting
              your services, redeeming their JoyPearls with you, and
              celebrating your wins — even when you’re offline.
            </p>
            <p>
              Here, you’re not marketing alone.
              <br />
              <strong>
                You’re part of an ecosystem where everyone grows together.
              </strong>
            </p>
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {hasActivePlan ? "Your Subscription" : "Choose Your Perfect Plan"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {hasActivePlan
              ? "Manage your current subscription with ease"
              : "Start for free or unlock premium features with our plans"}
          </p>
        </div>

        {hasActivePlan && data.currentPlan && (
          <CurrentPlanStatus
            currentPlan={data.currentPlan}
            planStart={data.planStart}
            planEnd={data.planEnd}
          />
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {/* Free Plan Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col transition-all duration-300 hover:shadow-xl">
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                Free Plan
              </h2>
              <p className="text-center text-gray-600 text-lg mt-2">
                $0 forever
              </p>
              <div className="mt-6">
                <ul className="space-y-3">
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
                    <li
                      key={feature}
                      className="flex items-start text-sm text-gray-600"
                    >
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => {
                if (!hasActivePlan) {
                  toast.info("You are now on the Free plan");
                } else {
                  toast.info("You are already on the Free plan");
                }
              }}
              className={`w-full mt-6 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                hasActivePlan
                  ? "bg-gray-200 text-gray-600 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              }`}
            >
              {hasActivePlan ? "Subscribed" : "Get Free Plan"}
            </button>
          </div>

          {/* Monthly Plan Card */}
          {monthlyPlan && (
            <div className="bg-white border-gray-200 rounded-xl shadow-lg p-6 flex flex-col transition-all duration-300 hover:shadow-xl">
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  Monthly
                </h2>
                <p className="text-center text-gray-600 text-lg mt-2">
                  ${monthlyPlan.price}/mo
                </p>
                <div className="mt-6">
                  <ul className="space-y-3">
                    {[
                      "Host 5 Challenges per Month",
                      "Listing on “Challenges” page",
                      "Listing on “Solopreneurs of the Day” page",
                      "Listing on “Webinars” page",
                      "Earn 25% Extra JoyPearls on every activity",
                      "List upto 5 products on the store (Zero commission on sales)",
                      "Redeem JoyPearls for Spotlights on MTB homepage, newsletter, challenges",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start text-sm text-gray-600"
                      >
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSubscribe(
                    monthlyPlan.id,
                    monthlyPlan.price,
                    monthlyPlan,
                    monthlyPlan.paypalPlanId,
                    true
                  )
                }
                disabled={isSubscribing || getDisabledStatus("Monthly Plan")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold w-full mt-6 shadow-md transition-all duration-200 disabled:bg-gray-300"
              >
                {isSubscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          )}

          {/* Yearly Plan Card */}
          {yearlyPlan && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col transition-all duration-300 hover:shadow-xl">
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  Yearly
                </h2>
                <p className="text-center text-gray-600 text-lg mt-2">
                  ${yearlyPlan.price}/yr
                </p>
                {yearlyPlan.discountPercent && (
                  <p className="text-green-600 text-sm text-center mt-2">
                    Save {yearlyPlan.discountPercent}%
                  </p>
                )}
                <div className="mt-6">
                  <ul className="space-y-3">
                    {[
                      "Host 5 Challenges per Month",
                      "Listing on “Challenges” page",
                      "Listing on “Solopreneurs of the Day” page",
                      "Listing on “Webinars” page",
                      "Earn 25% Extra JoyPearls on every activity",
                      "List upto 5 products on the store (Zero commission on sales)",
                      "Redeem JoyPearls for Spotlights on MTB homepage, newsletter, challenges",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start text-sm text-gray-600"
                      >
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSubscribe(
                    yearlyPlan.id,
                    yearlyPlan.price,
                    yearlyPlan,
                    yearlyPlan.paypalPlanId,
                    true
                  )
                }
                disabled={isSubscribing || getDisabledStatus("Yearly Plan")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold w-full mt-6 shadow-md transition-all duration-200 disabled:bg-gray-300"
              >
                {isSubscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          )}

          {/* Lifetime Plan Card (Highlighted) */}
          {lifetimeStandardPlan && (
            <div className="bg-gradient-to-b from-indigo-50 to-white border-2 border-indigo-500 rounded-xl shadow-2xl p-6 flex flex-col transition-all duration-300 hover:shadow-3xl relative">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Recommended
              </div>
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  Lifetime
                </h2>
                <p className="text-center text-gray-600 text-lg mt-2">
                  ${lifetimeStandardPlan.price}
                </p>
                <div className="mt-6">
                  <ul className="space-y-3">
                    {[
                      "Host 5 Challenges per Month",
                      "Listing on “Challenges” page",
                      "Listing on “Solopreneurs of the Day” page",
                      "Listing on “Webinars” page",
                      "Earn 25% Extra JoyPearls on every activity",
                      "List upto 5 products on the store (Zero commission on sales)",
                      "Redeem JoyPearls for Spotlights on MTB homepage, newsletter, challenges",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start text-sm text-gray-600"
                      >
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSubscribe(
                    lifetimeStandardPlan.id,
                    lifetimeStandardPlan.price,
                    lifetimeStandardPlan,
                    lifetimeStandardPlan.paypalPlanId,
                    false
                  )
                }
                disabled={
                  isSubscribing || getDisabledStatus("Lifetime Plan Standard")
                }
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold w-full mt-6 shadow-md transition-all duration-200 disabled:bg-gray-300"
              >
                {isSubscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Features Coming soon line */}
        <p className="text-center text-gray-500 italic mt-4">
          *Features Coming soon
        </p>

        {/* Lifetime Plan Pricing Table */}
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
                      className={`${
                        index === currentTierIndex
                          ? "text-white"
                          : "text-indigo-300"
                      } hover:bg-indigo-700/30 transition-colors duration-200`}
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
              <button
                onClick={() => {
                  if (data?.currentLifetimePlan && data?.plans) {
                    handleSubscribe(
                      data.currentLifetimePlan.planId,
                      "499",
                      data.plans.find(
                        (p) => p.id === data.currentLifetimePlan.planId
                      ) ?? data.plans[0],
                      data.currentLifetimePlan.paypalPlanId,
                      false
                    );
                  }
                }}
                disabled={
                  isSubscribing || !data?.currentLifetimePlan || !data?.plans
                }
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md transition-all duration-200 disabled:bg-gray-300"
              >
                {isSubscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Claim Spot for $499"
                )}
              </button>
            </div>
          </div>
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
    </div>
  );
};

export default SubscriptionPage;