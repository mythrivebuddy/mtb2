"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react"; // Import session for prefilling

import { load } from "@cashfreepayments/cashfree-js";
import {
  Check,
  Loader2,
  Tag,
  ShieldCheck,
  Globe,
  MapPin,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  amount: number;
  amountINR?: number;
  amountUSD?: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY" | "LIFETIME";
  features?: string[];
  isProgramPlan: boolean
}

interface CouponResponse {
  valid: boolean;
  code: string;
  discountType: "percentage" | "fixed" | "free_duration";
  discountValue: number;
  message?: string;
}

export default function CheckoutPage() {
  const { data: session } = useSession(); // Get User Session
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [plan, setPlan] = useState<Plan | null>(null);

  // Form State
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN", // Default to IN, will update via IP
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(
    null
  );
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // ---------------------------
  // 0. PREFILL DATA & DETECT IP
  // ---------------------------
  useEffect(() => {
    // 1. Prefill Name/Email from Session
    if (session?.user) {
      setBillingDetails((prev) => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }));
    }

    // 2. Detect Country via IP
    const detectCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_code && data.country_code !== "IN") {
          setBillingDetails((prev) => ({ ...prev, country: "US" })); // Set to US/Global for non-India
        } else {
          setBillingDetails((prev) => ({ ...prev, country: "IN" }));
        }
      } catch (error) {
        console.warn("IP detection failed, defaulting to India", error);
      }
    };
    detectCountry();
  }, [session]);

  // ---------------------------
  // 1. FETCH PLAN + AUTO APPLY
  // ---------------------------
  useEffect(() => {
    async function init() {
      if (!planId) return;

      try {
        const planRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription-plans/${planId}`
        );
        if (!planRes.ok) throw new Error("Failed to fetch plan");
        const planData = await planRes.json();
        setPlan(planData);

        // AUTO APPLY COUPON
        try {
          const autoRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/auto-apply`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planId,
                currency: planData.currency || "INR",
                billingCountry: billingDetails.country, // Use detected country
                userType: session?.user.userType,
                userId: session?.user?.id,
              }),
            }
          );

          const text = await autoRes.text();
          const autoData = text ? JSON.parse(text) : null;

          if (autoData?.coupon) {
            const c = autoData.coupon;
            const discountType =
              c.type === "FREE_DURATION"
                ? "free_duration"
                : c.type === "FULL_DISCOUNT"
                  ? "percentage"
                  : c.type.toLowerCase();

            const discountValue =
              c.type === "FULL_DISCOUNT"
                ? 100
                : c.discountAmount || c.discountPercentage || 0;

            setAppliedCoupon({
              valid: true,
              code: c.code,
              discountType,
              discountValue,
              message: "Best offer auto-applied",
            });
            setCouponCode(c.code);
            setCouponMessage({
              type: "success",
              text: `Auto-applied: ${c.code}`,
            });
          }
        } catch (error) {
          console.warn("Auto apply failed", error);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [planId]); // Note: We don't depend on billingDetails.country here to avoid refetching loop, logic handles dynamic currency below

  // ---------------------------
  // 2. MANUAL VERIFY
  // ---------------------------
  const handleVerifyCoupon = async () => {
    if (!couponCode || !plan) return;

    setVerifyingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: couponCode,
            planId: plan.id,
            currency: plan.currency || "INR",
            billingCountry: billingDetails.country,
            userType: session?.user.userType,
            userId: session?.user?.id,
          }),
        }
      );

      const data = await res.json();

      if (data.valid && data.coupon) {
        const c = data.coupon;
        const discountType =
          c.type === "FREE_DURATION"
            ? "free_duration"
            : c.type === "FULL_DISCOUNT"
              ? "percentage"
              : c.type.toLowerCase();

        const discountValue =
          c.type === "FULL_DISCOUNT"
            ? 100
            : c.discountAmount || c.discountPercentage || 0;

        setAppliedCoupon({
          valid: true,
          code: c.code,
          discountType,
          discountValue,
        });

        setCouponMessage({
          type: "success",
          text: "Coupon applied successfully!",
        });
      } else {
        setAppliedCoupon(null);
        setCouponMessage({
          type: "error",
          text: data.message || "Invalid coupon",
        });
        setCouponCode("")
        setAppliedCoupon(null)
      }
    } catch (error) {
      setCouponMessage({ type: "error", text: "Could not verify coupon" });
      console.log(error);
    } finally {
      setVerifyingCoupon(false);
    }
  };

  // ---------------------------
  // 3. BILLING CALC
  // ---------------------------
  const billing = useMemo(() => {
    if (!plan)
      return {
        base: 0,
        discount: 0,
        taxableAmount: 0,
        tax: 0,
        total: 0,
        currency: "INR",
      };

    const isIndia = billingDetails.country === "IN";
    const currency = isIndia ? "INR" : "USD";

    // Logic: If IN -> amountINR, else -> amountUSD (fallback to amount)
    const subtotal = isIndia
      ? (plan.amountINR ?? plan.amount ?? 0)
      : (plan.amountUSD ?? plan.amount ?? 0);

    let discount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        discount = (subtotal * appliedCoupon.discountValue) / 100;
      } else if (appliedCoupon.discountType === "fixed") {
        discount = appliedCoupon.discountValue;
      } else if (appliedCoupon.discountType === "free_duration") {
        discount = subtotal;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);

    if (taxableAmount === 0) {
      return {
        base: subtotal,
        discount,
        taxableAmount: 0,
        tax: 0,
        total: 1,
        currency,
      };
    }

    const taxRate = isIndia ? 0.18 : 0;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;

    return {
      base: subtotal,
      discount,
      taxableAmount,
      tax,
      total: parseFloat(total.toFixed(2)),
      currency,
    };
  }, [plan, appliedCoupon, billingDetails.country]);

  // Handle Input Changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------------------
  // 4. CHECKOUT
  // ---------------------------
  const persistCheckoutState = (payload: Record<string, unknown>) => {
  try {
    localStorage.setItem(
      "checkout_state",
      JSON.stringify({
        ...payload,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.error("Failed to persist checkout state", e);
  }
};

 const handleSubscribe = async () => {
  if (!plan) return;

  // Basic Validation
  if (
    !billingDetails.addressLine1 ||
    !billingDetails.city ||
    !billingDetails.postalCode
  ) {
    toast.error("Please fill in all required address fields.");
    return;
  }

  setProcessingPayment(true);

  try {
    let endpoint = "";
    const isProgram = plan.isProgramPlan === true; // IMPORTANT
    const isLifetime = plan.interval === "LIFETIME";

    // 1. Determine the correct backend endpoint
    if (isProgram) {
      // PURCHASE PROGRAM (One-time purchase)
      endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/purchase-programs`;
      console.log("Subscribing to Program (ONE_TIME purchase) →", endpoint);
    } else if (isLifetime) {
      // LIFETIME SUBSCRIPTION
      endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/lifetime-order`;
      console.log("Subscribing to Lifetime Plan →", endpoint);
    } else {
      // MONTHLY / YEARLY RECURRING PLAN
      endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/create-mandate`;
      console.log("Subscribing to Recurring Plan →", endpoint);
    }

    // 2. Call Backend
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        planId: plan.id,
        couponCode: appliedCoupon?.code || null,
        billingDetails: billingDetails,
      }),
    });

    const data = await res.json();
    console.log("cashfree api data ",data);
    persistCheckoutState({
  plan,
  billingDetails,
  appliedCoupon,
  backendResponse: {
    orderId: data.orderId,
    purchaseId: data.purchaseId,
    subscriptionId: data.subscriptionId,
    paymentSessionId: data.paymentSessionId,
    subscriptionSessionId: data.subscriptionSessionId,
    mode: data.mode,
    settings: data.settings,
  },
  checkoutType: isProgram
    ? "PROGRAM"
    : isLifetime
    ? "LIFETIME"
    : "RECURRING",
});

    
    if (!res.ok){
      throw new Error(data.error || "Backend creation failed");

    }

    // 3. Load Cashfree SDK
    const mode =
  data.mode === "prod"
    ? "production"
    : "sandbox";
    console.log("We are at this cashfree mode ",mode);
    
    const cf = await load({ mode });
    console.log("cashfree env settings ",data.settings);
    
    // 4A. Program Purchase Checkout
    if (isProgram) {
      if (!data.paymentSessionId) throw new Error("Invalid payment session for program");

      console.log(`Starting Program Checkout`, data.paymentSessionId);

      await cf.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/program-callback?order_id=${data.orderId}&purchase_id=${data.purchaseId}`,
      });

      return;
    }

    // 4B. Lifetime Checkout
    if (isLifetime) {
      if (!data.paymentSessionId) throw new Error("Invalid payment session ID");

      console.log(`Starting Lifetime Checkout`, data.paymentSessionId);

      await cf.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/payment-callback?order_id=${data.orderId}`,
      });

      return;
    }

    // 4C. Recurring Checkout
    if (!data.subscriptionSessionId)
      throw new Error("Invalid subscription session");

    await cf.subscriptionsCheckout({
      subsSessionId: data.subscriptionSessionId,
      redirectTarget: "_self",
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/subscription-callback?sub_id=${data.subscriptionId}`,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    toast.error("Something went wrong initiating payment");
  } finally {
    setProcessingPayment(false);
  }
};
useEffect(() => {
  const raw = localStorage.getItem("checkout_state");
  if (!raw) return;

  try {
    const checkoutState = JSON.parse(raw);
    console.log("Recovered checkout state:", checkoutState);

    // Use it for UI recovery, retry logic, analytics, etc.
  } catch (e) {
    console.error("Failed to parse checkout state", e);
  }
}, []);



  if (loading)
    return (
      <div className="flex justify-center h-screen items-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  if (!plan) return <div>Plan not found</div>;

  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Complete Your Subscription
          </h1>
          <p className="mt-2 text-gray-600">
            Unlock your potential with the {plan.name} plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT SIDE: BILLING FORM */}
          <div className="md:col-span-2 space-y-6">
            {/* PLAN SUMMARY CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* ... (Existing Plan Summary UI - kept concise for brevity) ... */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                    {plan.interval} Plan
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {billing.currency} {billing.total.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(plan.features || ["Access to all modules"]).map(
                    (feat, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-1" />
                        <span className="text-gray-600 text-sm">{feat}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* BILLING DETAILS FORM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b pb-2 flex-wrap">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Billing Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                {/* NAME - Full width on all screens for a standard layout */}
                <div className="col-span-full sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={billingDetails.name}
                      onChange={handleInputChange}
                      className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                      placeholder="John Doe"
                      readOnly // Read only if you want to enforce session name
                    />
                  </div>
                </div>

                {/* EMAIL - Full width on all screens for a standard layout */}
                <div className="col-span-full sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={billingDetails.email}
                      className="pl-9 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 sm:text-sm py-2 border"
                      readOnly
                    />
                  </div>
                </div>

                {/* PHONE - ALWAYS FULL WIDTH */}
                <div className="col-span-full">
                  <label className="block text-xs  font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5  h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={billingDetails.phone}
                      onChange={handleInputChange}
                      className="pl-9 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                {/* ADDRESS LINE 1 - ALWAYS FULL WIDTH */}
                <div className="col-span-full">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={billingDetails.addressLine1}
                    onChange={handleInputChange}
                    className="block w-full rounded-md bg-white border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                    placeholder="Street Address"
                    required
                  />
                </div>

                {/* GROUP FOR CITY, STATE, POSTAL, COUNTRY - THIS IS THE CRITICAL CHANGE */}
                <div className="col-span-full grid grid-cols-1 gap-2 md:grid-cols-2">
                  {/* CITY */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={billingDetails.city}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                      required
                    />
                  </div>

                  {/* STATE */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={billingDetails.state}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                      required
                    />
                  </div>

                  {/* POSTAL CODE */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={billingDetails.postalCode}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                      required
                    />
                  </div>

                  {/* COUNTRY */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <select
                        name="country"
                        value={billingDetails.country}
                        onChange={handleInputChange}
                        className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border bg-white"
                      >
                        <option value="IN">India</option>
                        <option value="US">United States</option>
                        <option value="OT">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: CHECKOUT SUMMARY */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Order Summary
                </h3>

                {/* COUPON INPUT */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="ENTER CODE"
                      className="flex-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                    />
                    <button
                      onClick={handleVerifyCoupon}
                      disabled={verifyingCoupon || !couponCode}
                      className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                    >
                      {verifyingCoupon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                  {couponMessage && (
                    <div
                      className={`mt-2 text-xs flex items-center gap-1 ${couponMessage.type === "success" ? "text-green-600" : "text-red-500"}`}
                    >
                      {couponMessage.type === "success" && (
                        <Tag className="w-3 h-3" />
                      )}
                      {couponMessage.text}
                    </div>
                  )}
                </div>

                {/* PRICE BREAKDOWN */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Base Price</span>
                    <span>
                      {billing.currency} {billing.base.toLocaleString()}
                    </span>
                  </div>

                  {billing.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Discount</span>
                      <span>
                        - {billing.currency} {billing.discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {billingDetails.country === "IN" ? "GST (18%)" : "Tax"}
                    </span>
                    <span>
                      + {billing.currency}{" "}
                      {billing.tax.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="h-px bg-gray-100 my-2"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">
                      Total Payable
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {billing.currency}{" "}
                      {billing.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* PAY BUTTON */}
                <button
                  onClick={handleSubscribe}
                  disabled={processingPayment}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-200"
                >
                  {processingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Pay {billing.currency}{" "}
                      {billing.total.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-xs text-gray-400">
                  Secure checkout powered by Cashfree.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
