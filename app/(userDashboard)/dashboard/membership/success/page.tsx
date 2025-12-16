"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

import { CheckCircle2, ArrowRight, Loader2, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import ConfettiClient from "./_components/ConfettiClient";
import InfoRow from "./_components/InfoRow";
import CountdownTimer from "./_components/CountdownTimer";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pid = searchParams.get("pid");
  const type = searchParams.get("type");

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const [yearlyPlanName, setYearlyPlanName] = useState<string | null>(null);

  /* --------------------------------------------------------------- */
  /* Verify payment */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    if (!pid || !type) {
      router.replace("/dashboard");
      return;
    }

    let retries = 0;
    const MAX_RETRIES = 5;

    const verify = async () => {
      try {
        const res = await axios.get("/api/billing/verify-success", {
          params: { pid, type },
          withCredentials: true,
        });

        if (res.data?.ok) {
          setRedirectTo(res.data.redirect);
          setYearlyPlanName(res.data.yearlyPlanName ?? null);
          setVerified(true);
          setLoading(false);
          return;
        }

        throw new Error();
      } catch {
        retries++;
        if (retries <= MAX_RETRIES) {
          setTimeout(verify, 2000);
        } else {
          router.replace("/dashboard");
        }
      }
    };

    verify();
  }, [pid, type, router]);

  /* --------------------------------------------------------------- */
  /* Loading guard */
  /* --------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold">Verifying</h2>
            <p className="text-slate-600 text-sm">
              We’re confirming your purchase and setting things up for you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified) return null;

  /* --------------------------------------------------------------- */
  /* Success UI */
  /* --------------------------------------------------------------- */

  const isProgram = type === "program";
  const programStart = new Date("2026-01-07T12:00:00+05:30");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <ConfettiClient />

      <Card className="max-w-lg w-full shadow-2xl border-none relative">
        <div className="bg-green-600 h-2 w-full" />

        <CardContent className="pt-8 pb-8 px-8 text-center space-y-5">
          {/* Program start badge */}
          {isProgram && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-4 py-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Program starts · 7 Jan 2026
              </span>
            </div>
          )}

          {/* Icon */}
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-slate-900">
            Payment Successful
          </h1>

          {isProgram && (
            <>
              <p className="text-slate-600 leading-relaxed">
                🎉 You’re officially enrolled in the{" "}
                <strong>MTB 2026: Complete Makeover Program</strong>. We’re
                excited to have you on this transformation journey.
              </p>

              <InfoRow
                text={
                  yearlyPlanName
                    ? `As part of this program, you’ve received a complimentary 1-year subscription to the “${yearlyPlanName}” plan.`
                    : "As part of this program, you’ve received a complimentary 1-year premium subscription."
                }
              />

              <CountdownTimer startDate={programStart} />
              <p className="text-sm text-slate-700">
                Your subscription benefits are active immediately, and full
                program access will unlock once the program begins.
              </p>
            </>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col w-full gap-3 pt-4">
            <Button asChild className="w-full">
              <Link href={redirectTo}>
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>

            <Button asChild className="w-full bg-brand hover:bg-brand/90">
              <Link href="/dashboard/subscription">
                View Subscription Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
