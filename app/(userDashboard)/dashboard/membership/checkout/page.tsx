"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
// @ts-ignore no types for Cashfree SDK
import { load } from "@cashfreepayments/cashfree-js";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      if (!planId) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription-plans/${planId}`, {
        credentials: "include"
      });
      const data = await res.json();
      setPlan(data);
      setLoading(false);
    }
    fetchPlan();
  }, [planId]);

  // Inside CheckoutPage.tsx

  const handleSubscribe = async () => {
    if (!planId) return;
    setProcessing(true);

    try {
      const subResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/create-mandate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId })
      });

      const subData = await subResp.json();
      
      if (!subResp.ok) throw new Error(subData.error || "Subscription creation failed");

      // 1. Get the Subscription Session ID
      const sessionId = subData.subscriptionSessionId; 
      if (!sessionId) throw new Error("Missing subscription session ID");

      // 2. Load the Cashfree SDK
      const cf = await load({
        mode: process.env.NODE_ENV === "production" ? "production" : "sandbox"
      });

      if (!cf) throw new Error("Failed to load Cashfree SDK");

      // 3. Initiate SUBSCRIPTION Checkout 
      // USE THIS instead of cf.checkout()
      await cf.subscriptionsCheckout({
        subsSessionId: sessionId, // Key must be 'subsSessionId'
        redirectTarget: "_self"   // Optional: "_self", "_blank", etc.
      });

    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      alert(err.message || "Could not initiate checkout");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading …</div>;
  if (!plan) return <div>Plan not found</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Subscribe</h1>
      <div className="border p-6 rounded shadow">
        <h2 className="text-xl">{plan.name}</h2>
        <p className="mt-2">₹{plan.amountINR} / {plan.interval}</p>
        <button
          onClick={handleSubscribe}
          disabled={processing}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full"
        >
          {processing ? "Processing…" : "Setup Autopay"}
        </button>
      </div>
    </div>
  );
}
