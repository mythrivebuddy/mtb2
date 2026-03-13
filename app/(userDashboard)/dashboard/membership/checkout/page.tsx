"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
import { GST_REGEX } from "@/lib/constant";
import axios from "axios";
import { RazorpayCheckoutOptions, RazorpayErrorResponse, RazorpaySuccessResponse, WindowWithRazorpay } from "@/types/client/razorpay-client.types";

// types

interface CheckoutChallenge {
  id: string;
  title: string;
  description: string;
  challengeJoiningFee: number;
  challengeJoiningFeeCurrency: "INR" | "USD";
}

interface Plan {
  id: string;
  name: string;
  amount: number;
  amountINR?: number;
  amountUSD?: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY" | "LIFETIME";
  features?: string[];
  isProgramPlan: boolean;
}
interface MMPProgram {
  id: string
  name: string
  // title: string
  description: string
  priceINR: number
  priceUSD: number
}

interface CouponResponse {
  valid: boolean;
  code: string;
  discountType: "percentage" | "fixed" | "free_duration";
  type: "PERCENTAGE" | "FIXED" | "FREE_DURATION" | "FULL_DISCOUNT";
  // discountValue: number;
  discountPercentage?: number | null;
  discountAmountINR?: number | null;
  discountAmountUSD?: number | null;
  message?: string;
}

type PaymentGateway = "CASHFREE" | "RAZORPAY";

export default function CheckoutPage() {
  const { data: session } = useSession(); // Get User Session
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const context = searchParams.get("context"); // e.g. CHALLENGE , STORE_PRODUCT, MMP_PROGRAM
  const challengeId = searchParams.get("challengeId"); // present if context is challenge
  const mmp_programId = searchParams.get("mmp_programId");
  // const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [challenge, setChallenge] = useState<CheckoutChallenge | null>(null);
  const [challengePricing, setChallengePricing] = useState<{
    amountINR: number;
    amountUSD: number;
    baseCurrency: "INR" | "USD";
  } | null>(null);

  const [mmpProgram, setmmpProgram] = useState<MMPProgram | null>(null)
  // to get active gateway
  const [activeGateway, setActiveGateway] =
    useState<PaymentGateway>("CASHFREE");

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
    gstNumber: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(
    null,
  );
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [mmpLoading, setMmpLoading] = useState(false);

  // get active gateway on load
  useEffect(() => {
    const fetchGateway = async () => {
      try {
        const res = await fetch("/api/admin/payment-gateway-config");
        const data = await res.json();
        setActiveGateway(data.gateway);
      } catch {
        setActiveGateway("CASHFREE"); // safe fallback
      }
    };

    fetchGateway();
  }, []);
  // razorpay script loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as unknown as WindowWithRazorpay).Razorpay)
        return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };


  const handleWithRazorpay = async (): Promise<void> => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Razorpay SDK failed to load");
      setProcessingPayment(false);
      return;
    }

    if (context == "SUBSCRIPTION" && !plan) return;
    if (context === "CHALLENGE" && !challenge) return;
    if (context === "MMP_PROGRAM" && !mmpProgram) return;

    try {
      const isLifetime = plan?.interval === "LIFETIME";
      const isRecurring =
        plan?.interval === "MONTHLY" || plan?.interval === "YEARLY";

      let endpoint = "";

      // ✅ CHALLENGE FLOW
      if (context === "CHALLENGE" || context === "MMP_PROGRAM" || context === "STORE_PRODUCT") {
        endpoint = "/api/billing/razorpay/challenge/create-order";

        // payload = {
        //   challengeId,
        //   billingDetails,
        // };
      } else {
        // 1️⃣ Backend endpoint
        if (isLifetime) {
          endpoint = "/api/billing/razorpay/create-one-time-order";
        } else if (isRecurring) {
          endpoint = "/api/billing/razorpay/create-subscription";
        } else {
          throw new Error("Unsupported plan interval");
        }
      }

      // 2️⃣ Create order / subscription
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: context === "SUBSCRIPTION" ? plan?.id : undefined,
          entityId:
            context === "CHALLENGE"
              ? challengeId
              : context === "MMP_PROGRAM"
                ? mmp_programId
                : undefined,
          context,
          couponCode: appliedCoupon?.code || null,
          billingDetails,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Razorpay order creation failed");
      }

      // 3️⃣ Razorpay options
      const options: RazorpayCheckoutOptions = {
        key: data.key,
        name: "mythrivebuddy.com",
        description:
          context === "CHALLENGE"
            ? challenge?.title ?? ""
            : context === "MMP_PROGRAM"
              ? mmpProgram?.name ?? ""
              : plan?.name ?? "",
        theme: { color: "#0f172a" },

        // Inside handleWithRazorpay -> options object
        handler: function (response: RazorpaySuccessResponse) {
          const callbackUrl = new URL(
            context === "CHALLENGE" || context === "MMP_PROGRAM" || context === "STORE_PRODUCT"
              ? "/api/billing/razorpay/challenge/callback"
              : "/api/billing/razorpay/callback",
            window.location.origin,
          );
          if (context === "CHALLENGE" || context === "STORE_PRODUCT" || context === "MMP_PROGRAM") {
            callbackUrl.searchParams.set(
              "order_id",
              response.razorpay_order_id!,
            );
          } else if (isLifetime) {
            callbackUrl.searchParams.set(
              "order_id",
              response.razorpay_order_id!,
            );
          } else {
            callbackUrl.searchParams.set(
              "sub_id",
              response.razorpay_subscription_id!,
            );
          }

          callbackUrl.searchParams.set(
            "payment_id",
            response.razorpay_payment_id!,
          );
          callbackUrl.searchParams.set(
            "signature",
            response.razorpay_signature!,
          );

          window.location.href = callbackUrl.toString();
        },

        prefill: {
          name: billingDetails.name,
          email: billingDetails.email,
          contact: billingDetails.phone,
        },

        // ✅ FAILURE / CLOSE HANDLING
        modal: {
          ondismiss: () => {
            if (context === "CHALLENGE") {
              window.location.href =
                `/dashboard/membership/failure?type=challenge` +
                (challengeId ? `&challengeId=${challengeId}` : "") +
                `&reason=checkout_closed`;
              return;
            }
            /* ---------- MINI MASTERY PROGRAM ---------- */

            if (context === "MMP_PROGRAM") {
              window.location.href =
                `/dashboard/membership/failure?type=mmp_program` +
                (mmp_programId ? `&mmp_programId=${mmp_programId}` : "") +
                `&reason=checkout_closed`;
              return;
            }

            /* ---------- STORE PRODUCT ---------- */

            if (context === "STORE_PRODUCT") {
              window.location.href =
                `/dashboard/membership/failure?type=store_product` +
                `&reason=checkout_closed`;
              return;
            }
            const type = isLifetime ? "lifetime" : "subscription"; // ✅ clearer type

            window.location.href =
              `/dashboard/membership/failure` +
              `?type=${type}` +
              (isLifetime && data.orderId // ✅ use data.orderId (not data.razorpayOrderId)
                ? `&orderId=${data.orderId}`
                : "") +
              (!isLifetime && data.subscriptionId // ✅ pass sub_id for recurring
                ? `&sub_id=${data.subscriptionId}`
                : "") +
              `&reason=checkout_closed`;
          },
        },
      };

      // 4️⃣ Attach identifiers
      // ✅ Attach identifiers properly
      if (context === "CHALLENGE" || context === "MMP_PROGRAM" || context === "STORE_PRODUCT") {
        options.order_id = data.orderId;
      } else if (isLifetime) {
        options.order_id = data.orderId;
      } else if (isRecurring) {
        options.subscription_id = data.subscriptionId;
      }

      // 5️⃣ Open checkout
      const RazorpayConstructor = (window as unknown as WindowWithRazorpay)
        .Razorpay;

      if (!RazorpayConstructor) {
        toast.error("Razorpay not loaded");
        return;
      }

      const rzp = new RazorpayConstructor(options);

      // ✅ PAYMENT FAILED EVENT (very important)
      rzp.on("payment.failed", (response: RazorpayErrorResponse) => {
        const reason =
          response?.error?.description ||
          response?.error?.reason ||
          "payment_failed";

        if (context === "CHALLENGE") {
          window.location.href =
            `/dashboard/membership/failure?type=challenge` +
            (challengeId ? `&challengeId=${challengeId}` : "") +
            `&reason=${encodeURIComponent(reason)}`;
          return;
        }
        if (context === "MMP_PROGRAM") {
          window.location.href =
            `/dashboard/membership/failure?type=mmp_program` +
            (mmp_programId ? `&mmp_programId=${mmp_programId}` : "") +
            `&reason=${encodeURIComponent(reason)}`;
          return;
        }

        /* ---------- STORE PRODUCT ---------- */

        if (context === "STORE_PRODUCT") {
          window.location.href =
            `/dashboard/membership/failure?type=store_product` +
            `&reason=${encodeURIComponent(reason)}`;
          return;
        }

        const type = isLifetime ? "lifetime" : "subscription"; // ✅ was "mandate"
        window.location.href =
          `/dashboard/membership/failure` +
          `?type=${type}` +
          (isLifetime && response.error.metadata?.order_id
            ? `&orderId=${response.error.metadata.order_id}`
            : "") +
          (!isLifetime && response.error.metadata?.subscription_id
            ? `&sub_id=${response.error.metadata.subscription_id}`
            : "") +
          `&reason=${encodeURIComponent(reason)}`;
      });

      rzp.open();
    } catch (error) {
      console.error("Razorpay Error:", error);
      toast.error("Unable to initiate Razorpay payment");
    }
  };

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
        if (data.country_code && data.country_code == "IN") {
          setBillingDetails((prev) => ({ ...prev, country: "IN" }));
        } else if (data.country_code === "US") {
          setBillingDetails((prev) => ({ ...prev, country: "US" }));
        } else {
          setBillingDetails((prev) => ({ ...prev, country: "OT" }));
        }
      } catch (error) {
        console.warn("IP detection failed, defaulting to India", error);
      }
    };
    detectCountry();
  }, []);

  // ---------------------------
  // 1. FETCH PLAN + AUTO APPLY
  // ---------------------------
  useEffect(() => {
    async function init() {
      setLoading(true);

      try {
        // ✅ CHALLENGE CONTEXT
        if (context === "CHALLENGE" && challengeId) {
          setChallengeLoading(true);
          const res = await axios.get(`/api/challenge/${challengeId}`);

          if (!res.data.success) {
            throw new Error("Failed to fetch challenge");
          }

          setChallenge(res.data.challenge);
          setChallengePricing(res.data.pricing);
          setPlan(null);
          setChallengeLoading(false);
          return;
        }

        // ✅ SUBSCRIPTION CONTEXT
        if (context === "SUBSCRIPTION" && planId) {
          const planRes = await fetch(`/api/subscription-plans/${planId}`);

          if (!planRes.ok) throw new Error("Failed to fetch plan");

          const planData = await planRes.json();
          setPlan(planData);
          setChallenge(null);
          return;
        }
        // ✅ MMP PROGRAM CONTEXT
        if (context === "MMP_PROGRAM" && mmp_programId) {
          setMmpLoading(true);
          const res = await axios.get(`/api/mini-mastery-programs/for-payment-checkout/${mmp_programId}`)

          const p = res.data.program

          setmmpProgram({
            id: p.id,
            name: p.name,
            description: p.description,
            priceINR: p.priceINR,
            priceUSD: p.priceUSD,
          })
          setPlan(null);
          setChallenge(null);

          setMmpLoading(false);

          return
        }
      } catch (error) {
        console.error("Checkout init error:", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [context, challengeId, planId, mmp_programId]);


  useEffect(() => {
    async function init() {
      if (context === "SUBSCRIPTION" && !planId) return;
      if (context === "CHALLENGE" && !challengeId) return;
      const isIndia = billingDetails.country === "IN";
      const currency = isIndia ? "INR" : "USD";
      setLoading(true);
      try {

        if (context === "SUBSCRIPTION" && planId) {
          const planRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription-plans/${planId}`,
          );

          if (!planRes.ok) throw new Error("Failed to fetch plan");

          const planData = await planRes.json();
          setPlan(planData);
        }

        // AUTO APPLY COUPON
        try {
          const autoRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/auto-apply`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planId: context === "SUBSCRIPTION" ? planId : null,
                challengeId: context === "CHALLENGE" ? challengeId : null,
                mmp_programId: context === "MMP_PROGRAM" ? mmp_programId : null,
                currency: currency,
                billingCountry: billingDetails.country, // Use detected country
                userType: session?.user.userType,
                userId: session?.user?.id,
              }),
            },
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

            // const discountValue =
            //   c.type === "FULL_DISCOUNT"
            //     ? 100
            //     : c.discountAmount || c.discountPercentage || 0;

            setAppliedCoupon({
              valid: true,
              code: c.code,
              discountType,
              type: c.type,
              discountPercentage: c.discountPercentage,
              discountAmountINR: c.discountAmountINR,
              discountAmountUSD: c.discountAmountUSD,
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
  }, [planId, challengeId, context]);
  // Note: We don't depend on billingDetails.country here to avoid refetching loop, logic handles dynamic currency below

  // ---------------------------
  // 2. MANUAL VERIFY
  // ---------------------------
  const handleVerifyCoupon = async () => {
    if (!couponCode || (context === "SUBSCRIPTION" && !plan) || (context === "CHALLENGE" && !challenge) ||
      (context === "MMP_PROGRAM" && !mmpProgram)
    ) return;

    setVerifyingCoupon(true);
    setCouponMessage(null);
    const isIndia = billingDetails.country === "IN";
    const currency = isIndia ? "INR" : "USD";
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: couponCode,
            planId: context === "SUBSCRIPTION" ? plan?.id : null,
            challengeId: context === "CHALLENGE" ? challenge?.id : null,
            mmp_programId: context === "MMP_PROGRAM" ? mmpProgram?.id : null,
            currency: currency,
            billingCountry: billingDetails.country,
            userType: session?.user.userType,
            userId: session?.user?.id,
          }),
        },
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

        setAppliedCoupon({
          valid: true,
          code: c.code,
          discountType,
          type: c.type,
          discountPercentage: c.discountPercentage,
          discountAmountINR: c.discountAmountINR,
          discountAmountUSD: c.discountAmountUSD,
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
        setCouponCode("");
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponMessage({ type: "error", text: "Could not verify coupon" });
      console.error(error);
    } finally {
      setVerifyingCoupon(false);
    }
  };

  // ---------------------------
  // 3. BILLING CALC
  // ---------------------------
  const billing = useMemo(() => {
    const isIndia = billingDetails.country === "IN";

    // -----------------------
    // CHALLENGE BILLING
    // -----------------------
    // -----------------------
    // PROGRAM BILLING
    // -----------------------
    if (context === "MMP_PROGRAM" && mmpProgram) {

      const isIndia = billingDetails.country === "IN"

      const currency: "INR" | "USD" = isIndia ? "INR" : "USD"

      const subtotal =
        currency === "INR"
          ? mmpProgram.priceINR
          : mmpProgram.priceUSD

      let discount = 0

      if (appliedCoupon?.type === "PERCENTAGE") {
        discount =
          (subtotal * (appliedCoupon.discountPercentage ?? 0)) / 100
      } else if (appliedCoupon?.type === "FIXED") {
        discount =
          currency === "INR"
            ? appliedCoupon.discountAmountINR ?? 0
            : appliedCoupon.discountAmountUSD ?? 0
      }
      else if (
        appliedCoupon?.type === "FREE_DURATION" ||
        appliedCoupon?.type === "FULL_DISCOUNT"
      ) {
        discount = subtotal
      }
      discount = Math.min(discount, subtotal)

      const taxableAmount = subtotal - discount
      // gst rate 
      const taxRate = currency === "INR" ? 0.18 : 0
      const tax = taxableAmount * taxRate

      const total = taxableAmount + tax

      return {
        base: subtotal,
        discount,
        taxableAmount,
        tax,
        total: Number(total.toFixed(2)),
        currency,
      }
    }
    if (context === "CHALLENGE" && challenge) {
      const isIndia = billingDetails.country === "IN";

      const subtotal = isIndia
        ? (challengePricing?.amountINR ?? challenge.challengeJoiningFee)
        : (challengePricing?.amountUSD ?? challenge.challengeJoiningFee);

      const currency = isIndia ? "INR" : "USD";

      let discount = 0;

      if (appliedCoupon) {
        if (appliedCoupon.type === "PERCENTAGE") {
          discount =
            (subtotal * (appliedCoupon.discountPercentage ?? 0)) / 100;
        } else if (appliedCoupon.type === "FIXED") {
          discount =
            currency === "INR"
              ? appliedCoupon.discountAmountINR ?? 0
              : appliedCoupon.discountAmountUSD ?? 0;
        } else if (
          appliedCoupon.type === "FREE_DURATION" ||
          appliedCoupon.type === "FULL_DISCOUNT"
        ) {
          discount = subtotal;
        }
      }

      discount = Math.min(discount, subtotal);

      const taxableAmount = subtotal - discount;

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
    }
    if (!plan)
      return {
        base: 0,
        discount: 0,
        taxableAmount: 0,
        tax: 0,
        total: 0,
        currency: "INR",
      };

    const currency = isIndia ? "INR" : "USD";

    // Logic: If IN -> amountINR, else -> amountUSD (fallback to amount)
    const subtotal = isIndia
      ? (plan.amountINR ?? plan.amount ?? 0)
      : (plan.amountUSD ?? plan.amount ?? 0);

    let discount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.type === "PERCENTAGE") {
        discount = (subtotal * (appliedCoupon.discountPercentage ?? 0)) / 100;
      } else if (appliedCoupon.type === "FIXED") {
        discount = isIndia
          ? (appliedCoupon.discountAmountINR ?? 0)
          : (appliedCoupon.discountAmountUSD ?? 0);
      } else if (
        appliedCoupon.type === "FREE_DURATION" ||
        appliedCoupon.type === "FULL_DISCOUNT"
      ) {
        discount = subtotal;
      }
    }
    discount = Math.min(discount, subtotal);

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
  }, [plan, challenge, challengePricing, context, appliedCoupon, billingDetails.country, mmpProgram]);

  // Handle Input Changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => ({
      ...prev,
      [name]: name === "gstNumber" ? value.toUpperCase() : value,
    }));
  };

  // ---------------------------
  // 4. CHECKOUT
  // ---------------------------

  const handleSubscribe = async () => {
    if (processingPayment) return;
    if (context === "SUBSCRIPTION" && !plan) return;
    if (context === "CHALLENGE" && !challenge) return;
    console.log(activeGateway);

    // Basic Validation
    if (
      !billingDetails.addressLine1 ||
      !billingDetails.city ||
      !billingDetails.postalCode
    ) {
      toast.error("Please fill in all required address fields.");
      return;
    }
    const gst = billingDetails.gstNumber.trim();

    if (billingDetails.country === "IN" && gst && !GST_REGEX.test(gst)) {
      toast.error("Invalid GST Number format");
      return;
    }

    setProcessingPayment(true);

    // handel razorpay checkout if active gateway is razorpay
    // if (activeGateway === "RAZORPAY") {
    //   await handleRazorpayPayment(plan.id);
    //   return;
    // }

    try {
      let endpoint = "";
      const isProgram = plan?.isProgramPlan === true; // IMPORTANT
      const isLifetime = plan?.interval === "LIFETIME";

      // ✅ ADDITION: Non-program plans handled separately (Razorpay)
      // 🔥 CHALLENGE must always use Razorpay
      if (context === "CHALLENGE" || context === "MMP_PROGRAM" || context === "STORE_PRODUCT") {
        try {
          await handleWithRazorpay();
        } finally {
          setProcessingPayment(false);
        }
        return;
      }

      // Subscription non-program → Razorpay
      if (plan && plan.isProgramPlan !== true) {
        try {
          await handleWithRazorpay();
        } finally {
          setProcessingPayment(false);
        }
        return;
      }

      // 1. Determine the correct backend endpoint
      if (isProgram) {
        // PURCHASE PROGRAM (One-time purchase)
        endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/purchase-programs`;
      } else if (isLifetime) {
        // LIFETIME SUBSCRIPTION
        // As our cashfree recurring application rejected we will create one time payment order with all plan as same
        // endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/lifetime-order`;
        endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/one-time-payment-order`;
      } else {
        // MONTHLY / YEARLY RECURRING PLAN
        // As our cashfree recurring application rejected  we will create one time payment order
        // endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/create-mandate`;
        endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/one-time-payment-order`;
      }

      // 2. Call Backend
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: plan?.id,
          couponCode: appliedCoupon?.code || null,
          billingDetails: billingDetails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Backend creation failed");
      }

      // 3. Load Cashfree SDK
      const mode = data.mode === "prod" ? "production" : "sandbox";

      const cf = await load({ mode });

      // 4A. Program Purchase Checkout
      if (isProgram) {
        if (!data.paymentSessionId)
          throw new Error("Invalid payment session for program");

        await cf.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
          returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/program-callback?order_id=${data.orderId}&purchase_id=${data.purchaseId}`,
        });

        return;
      }

      // 4B. Lifetime Checkout
      if (isLifetime) {
        if (!data.paymentSessionId)
          throw new Error("Invalid payment session ID");

        await cf.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
          returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/payment-callback?order_id=${data.orderId}&purchase_id=${data.purchaseId}`,
        });

        return;
      }
      if (!data.paymentSessionId) throw new Error("Invalid payment session ID");

      await cf.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/one-time-plan-callback?purchase_id=${data.purchaseId}&order_id=${data.orderId}`,
      });

      // 4C. Recurring Checkout
      // if (!data.subscriptionSessionId)
      //   throw new Error("Invalid subscription session");

      // await cf.subscriptionsCheckout({
      //   subsSessionId: data.subscriptionSessionId,
      //   redirectTarget: "_self",
      //   return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/subscription-callback?sub_id=${data.subscriptionId}`,
      // });
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Something went wrong initiating payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading || challengeLoading || mmpLoading)
    return (
      <div className="flex justify-center h-screen items-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  if (!plan && context === "SUBSCRIPTION") return <div>Plan not found</div>;
  if (context === "CHALLENGE" && !challenge && !challengeLoading)
    return <div>Challenge not found</div>;
  if (!mmpProgram && context === "MMP_PROGRAM" && !mmpLoading) return <div className="text-center flex justify-center items-center h-lvh text-2xl">Mini mastery program not found</div>;

  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {context === "CHALLENGE"
              ? "Complete Challenge Payment"
              : context === "MMP_PROGRAM" ? "Purchase Program"
                : "Complete Your Subscription"}
          </h1>
          <p className="mt-2 text-gray-600">
            {context === "CHALLENGE"
              ? `Join the "${challenge?.title}" challenge.`
              : plan?.name && `Unlock your potential with the ${plan?.name} plan.`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT SIDE: BILLING FORM */}
          <div className="md:col-span-2 space-y-6">
            {/* PLAN SUMMARY CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  {context === "CHALLENGE" ? (
                    <>
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        Paid Challenge
                      </span>
                      <h2 className="mt-3 text-2xl font-bold text-gray-900">
                        {challenge?.title}
                      </h2>
                    </>
                  ) : context === "MMP_PROGRAM" ? (
                    <>
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        Mini Mastery Program
                      </span>

                      <h2 className="mt-3 text-2xl font-bold text-gray-900">
                        {mmpProgram?.name}
                      </h2>
                    </>
                  ) : (
                    <>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        {plan?.interval} Plan
                      </span>
                      <h2 className="mt-3 text-2xl font-bold text-gray-900">
                        {plan?.name}
                      </h2>
                    </>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {billing.currency} {billing.total.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                {context === "CHALLENGE" ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Challenge Details
                    </h3>

                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: challenge?.description || "",
                      }}
                    />
                  </div>
                ) : context === "MMP_PROGRAM" ? (

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Program Details
                    </h3>

                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-1" />
                      {mmpProgram?.description || "Access to exclusive mini mastery program content and resources."}
                    </div>
                  </div>

                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(plan?.features || ["Access to all modules"]).map(
                      (feat, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-1" />
                          <span className="text-gray-600 text-sm">{feat}</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
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
                {/* GST NUMBER (OPTIONAL - INDIA ONLY) */}
                {billingDetails.country === "IN" && (
                  <div className="col-span-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={billingDetails.gstNumber}
                      onChange={handleInputChange}
                      placeholder="22AAAAA0000A1Z5"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border uppercase"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter GST number if you want GST invoice for business.
                    </p>
                  </div>
                )}

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
                  Secure checkout powered by{" "}
                  {context === "CHALLENGE"
                    ? "RAZORPAY"
                    : plan?.isProgramPlan
                      ? "CASHFREE"
                      : "RAZORPAY"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
