"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactConfetti from "react-confetti";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button"; // Standard shadcn component
import { Card, CardContent } from "@/components/ui/card";

export default function SuccessPage() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [confettiActive, setConfettiActive] = useState(true);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const timer = setTimeout(() => setConfettiActive(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {confettiActive && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
        />
      )}

      <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden">
        <div className="bg-green-600 h-2 w-full" />
        <CardContent className="pt-10 pb-8 px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-slate-600 mb-8">
            Welcome to the community! Your subscription is now active, and your
            premium features have been unlocked.
          </p>

          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-100 p-3 rounded-lg">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Instant access to all premium modules</span>
            </div>
            {/* <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-100 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Priority customer support activated</span>
            </div> */}
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
              <Link href="/dashboard">
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            {/* <Button asChild variant="ghost" className="text-slate-500">
              <Link href="/dashboard/membership/manage">
                View Billing Receipt
              </Link>
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}