/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { AlertCircle, RefreshCcw, ArrowLeft, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {  useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { toast } from "sonner";


export default function FailurePage() {
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type");
  const orderId = searchParams.get("orderId");
  const subId = searchParams.get("sub_id");
  const reason =
    searchParams.get("reason") ||
    "Cashfree did not return error details. User did not complete the payment.";

  const heading =
    typeParam === "subscription"
      ? "Mandate Failed"
      : typeParam === "challenge"
        ? "Challenge Payment Failed"
        : typeParam === "mmp_program"
          ? "Program Purchase Failed"
          : typeParam === "store_product"
            ? "Product Purchase Failed"
            : "Payment Failed";

  const description =
    typeParam === "subscription"
      ? "We couldn't create your automatic recurring payment mandate. No amount has been charged."
      : typeParam === "challenge"
        ? "Your payment for enrolling in the challenge could not be completed."
        : typeParam === "mmp_program"
          ? "Your purchase of this Mini Mastery Program could not be completed."
          : typeParam === "store_product"
            ? "Your product purchase could not be completed."
            : "Your payment could not be completed.";

  const reference = typeParam === "subscription" ? subId : orderId;
  const challengeId = searchParams.get("challengeId");
  const programId = searchParams.get("mmp_programId");
  const storeOrderId = searchParams.get("storeOrderId");

  const retryUrl =
    typeParam === "challenge"
      ? challengeId
        ? `/dashboard/membership/checkout?context=CHALLENGE&challengeId=${challengeId}`
        : "/dashboard/challenge"
      : typeParam === "mmp_program"
        ? programId
          ? `/dashboard/membership/checkout?context=MMP_PROGRAM&mmp_programId=${programId}`
          : "/dashboard/mini-mastery-programs"
        : typeParam === "store_product"
          ? storeOrderId
            ? `/dashboard/store/product/${storeOrderId}`
            : "/dashboard/store"
          : "/pricing";
  const referenceLabel =
    typeParam === "subscription" ? "Subscription ID" : "Order ID";
  useEffect(() => {
    toast.error("Payment failed. Please try again.");
  }, [])

  // -----------------------------------------------------------------------
  // 3. Render UI
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-xl overflow-hidden">
        <div className="bg-red-500 h-2 w-full" />

        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <AlertCircle className="w-12 h-12" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            {heading}
          </h1>

          <p className="text-slate-600 mb-6 text-sm">{description}</p>

          {/* Details Box */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-8 text-left">
            {reference && (
              <>
                <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Hash size={12} />
                    {referenceLabel}
                  </span>
                  <span className="font-mono text-slate-700">{reference}</span>
                </div>

                <Separator className="mb-3" />
              </>
            )}

            <h4 className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1">
              Failure Reason
            </h4>

            <p className="text-sm text-red-700 leading-relaxed font-medium">
              "{reason.replace(/_/g, " ")}"
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="w-full bg-slate-900 hover:bg-slate-800 h-12"
            >
              <Link href={retryUrl}>
                <RefreshCcw className="mr-2 w-4 h-4" /> Try Again
              </Link>
            </Button>

            <div className="grid grid-cols-1 gap-3">
              {!(typeParam == "challenge" || typeParam == "store_product" || typeParam === "mmp_program") && (
                <Button asChild variant="outline" className="text-sm">
                  <Link href="/pricing">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back to Plans
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
