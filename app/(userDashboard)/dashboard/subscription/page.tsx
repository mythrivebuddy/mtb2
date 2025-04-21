"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format, differenceInDays } from "date-fns";
import { Check, Loader2, Info, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { 
  PayPalScriptProvider, 
  PayPalButtons 
} from "@paypal/react-paypal-js";
import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";

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

const calculateProratedPrice = (
  currentPlan: Plan,
  newPlan: Plan,
  planStart: string | null
): number => {
  if (!currentPlan || !planStart) return parseFloat(newPlan.price);

  const currentPrice = parseFloat(currentPlan.price);
  const newPrice = parseFloat(newPlan.price);
  const daysUsed = differenceInDays(new Date(), new Date(planStart));
  
  if (newPlan.durationDays === null && currentPlan.durationDays) {
    const daysRemaining = currentPlan.durationDays - daysUsed;
    const refundAmount = (daysRemaining / currentPlan.durationDays) * currentPrice;
    return Math.max(0, newPrice - refundAmount);
  }

  if (currentPlan.durationDays === 30 && newPlan.durationDays === 365) {
    const daysRemaining = currentPlan.durationDays - daysUsed;
    const refundAmount = (daysRemaining / currentPlan.durationDays) * currentPrice;
    return Math.max(0, newPrice - refundAmount);
  }

  return newPrice;
};

// Payment Modal Component
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  price: string;
  onSuccess: () => void;
}

// Define PayPal response types for better type safety
// type PayPalOrderStatus = 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';


const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  price,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Early return if modal is closed
  if (!isOpen) return null;

  // Verify PayPal payment with our backend
  const verifyPayPalPayment = async (orderId: string): Promise<boolean> => {
    try {
      const response = await axios.post<{ success: boolean }>('/api/payments/paypal/verify', { orderId });
      return response.data.success;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  };

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
            You&apos;re subscribing to the <span className="font-medium">{plan.name}</span>
          </p>
          <div className="text-lg font-bold mt-2 flex items-center">
            {parseFloat(price) < parseFloat(plan.price) && (
              <>
                <span className="line-through text-gray-500 mr-2">{`$${plan.price}`}</span>
                <span>Total: ${price}</span>
              </>
            )}
            {parseFloat(price) >= parseFloat(plan.price) && (
              <span>Total: ${price}</span>
            )}
          </div>
          {parseFloat(price) < parseFloat(plan.price) && (
            <p className="text-sm text-green-600 mt-1">
              You save ${(parseFloat(plan.price) - parseFloat(price)).toFixed(2)} with prorated pricing
            </p>
          )}
        </div>

        {isProcessing && (
          <div className="flex justify-center items-center my-4 py-2 bg-gray-50 rounded-md">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
            <span className="text-gray-700">Processing payment...</span>
          </div>
        )}

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AUi4qbdDTZy5KuUipcF0TIfunsSzNjgSm4VCNJiIDj98Wq-zM_WdW5XLtRdS9FEG2rM0TvYT8U6iDh9h",
            currency: "USD",
            intent: "capture",
            components: "buttons",
            "debug": process.env.NODE_ENV !== "production",
          }}
        >
          <PayPalButtons
            style={{ 
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "pay"
            }}
            disabled={isProcessing}
            forceReRender={[price, isProcessing]}
            createOrder={(_, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [{
                  amount: {
                    value: price,
                    currency_code: "USD",
                  },
                  description: `Subscription to ${plan.name}`,
                }],
                application_context: {
                  shipping_preference: "NO_SHIPPING"
                }
              });
            }}
            onApprove={async (data, actions) => {
              setIsProcessing(true);
              try {
                // Capture the funds from the transaction
                const details = await actions.order?.capture();
                console.log("Payment completed:", details);
                
                // Verify the payment with our backend
                const verified = await verifyPayPalPayment(data.orderID);
                
                if (verified) {
                  // Call the success callback to update subscription in our database
                  await onSuccess();
                  toast.success("Payment successful! Your subscription has been activated.");
                } else {
                  toast.error("Payment verification failed. Please contact support.");
                }
              } catch (error) {
                console.error("Payment processing error:", error);
                toast.error("Payment processing failed. Please try again.");
              } finally {
                setIsProcessing(false);
                onClose();
              }
            }}
            onError={(err) => {
              console.error("PayPal error:", err);
              toast.error("Payment failed. Please try again or use a different payment method.");
            }}
            onCancel={() => {
              toast.info("Payment cancelled. Your subscription was not processed.");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};

// Plan Card Component
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
      {isCurrentPlan
        ? "Current Plan"
        : disabled
        ? "Not Available"
        : isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Subscribe"
          )}
    </button>
  </div>
);

// Current Plan Status Component
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
const SubscriptionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await axios.get<SubscriptionData>("/api/user/subscription");
      return response.data;
    },
  });

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

  const handleSubscribe = (planId: string, price: string, plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedPrice(price);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) {
      toast.error("No plan selected");
      return;
    }
    
    setIsSubscribing(true);
    try {
      // After successful PayPal payment, update the subscription in our database
      await subscribeMutation.mutateAsync(selectedPlan.id);
      // Close modal and reset state after successful subscription
      setIsModalOpen(false);
      setSelectedPlan(null);
      setSelectedPrice("");
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error("Failed to update subscription:", error);
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

  // Calculate prorated prices
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

  const hasLifetimePlan = data?.currentPlan?.name === "Lifetime Plan";
  const hasActivePlan = data?.hasActiveSubscription && data?.currentPlan;

  return (
    <div className="w-full mt-5">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(!hasActivePlan || data?.currentPlan?.name !== "Monthly Plan") &&
            data?.currentPlan?.name !== "Yearly Plan" &&
            !hasLifetimePlan &&
            monthlyPlan && (
              <PlanCard
                name="Monthly Plan"
                price={monthlyPlan.price}
                period="per month"
                onSubscribe={() =>
                  handleSubscribe(monthlyPlan.id, monthlyPlan.price, monthlyPlan)
                }
                isLoading={isSubscribing}
                disabled={hasLifetimePlan}
              />
            )}

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

          {(!hasActivePlan || data?.currentPlan?.name !== "Yearly Plan") &&
            !hasLifetimePlan &&
            yearlyPlan && (
              <PlanCard
                name="Yearly Plan"
                price={yearlyPlan.price} // Show original price on plan cards
                period="per year"
                discount={
                  data?.currentPlan?.name !== "Monthly Plan"
                    ? "Save 14%"
                    : "Prorated price available"
                }
                onSubscribe={() =>
                  handleSubscribe(yearlyPlan.id, proratedYearlyPrice, yearlyPlan)
                }
                isLoading={isSubscribing}
                disabled={hasLifetimePlan}
              />
            )}

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

          {!hasLifetimePlan && lifetimePlan && (
            <PlanCard
              name="Lifetime Plan"
              price={lifetimePlan.price} // Show original price on plan cards
              period="one-time payment"
              discount={hasActivePlan ? "Prorated price available" : undefined}
              onSubscribe={() =>
                handleSubscribe(lifetimePlan.id, proratedLifetimePrice, lifetimePlan)
              }
              isLoading={isSubscribing}
            />
          )}

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
              onClick={() =>
                handleSubscribe("lifetime-limited", "499", lifetimePlan!)
              }
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

      {selectedPlan && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plan={selectedPlan}
          price={selectedPrice}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;