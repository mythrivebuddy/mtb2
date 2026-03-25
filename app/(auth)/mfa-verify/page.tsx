"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, ShieldCheck } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MfaCheckVerifiedResponse { verified: boolean; }
interface MfaVerifyResponse        { success: boolean; }
interface MfaVerifyError           { error: string; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function MfaVerifyPage() {
  const [otp,   setOtp]   = useState("");
  const [error, setError] = useState("");
  const router            = useRouter();

  // ── Check if already verified ──────────────────────────────────────────
  const { data: verifiedData } = useQuery<MfaCheckVerifiedResponse>({
    queryKey: ["mfa-check-verified"],
    queryFn:  () =>
      axios
        .get<MfaCheckVerifiedResponse>("/api/admin/mfa/check-verified")
        .then((r) => r.data),
    staleTime: 0,
  });

  useEffect(() => {
    if (verifiedData?.verified) {
      router.replace("/admin/dashboard");
    }
  }, [verifiedData, router]);

  // ── Verify OTP mutation ────────────────────────────────────────────────
  const verifyMutation = useMutation<MfaVerifyResponse, AxiosError<MfaVerifyError>, string>({
    mutationFn: (otpCode) =>
      axios
        .post<MfaVerifyResponse>("/api/admin/mfa/verify", { otp: otpCode })
        .then((r) => r.data),
    onSuccess: () => {
      router.push("/admin/dashboard");
    },
    onError: (err) => {
      setError(err.response?.data?.error ?? "Invalid OTP");
    },
  });

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }
    setError("");
    verifyMutation.mutate(otp);
  };

  const isLoading = verifyMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md space-y-6">

        {/* Icon + Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
          <p className="text-gray-500 text-sm">
            Open your Google Authenticator app and enter the 6-digit code.
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Authentication Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="000000"
            className={`w-full h-14 text-center text-2xl font-bold tracking-[0.5em] border rounded-xl outline-none transition-all
              ${error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
            `}
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading || otp.length !== 6}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
          ) : (
            <><ShieldCheck className="w-5 h-5" /> Verify & Continue</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Code refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}