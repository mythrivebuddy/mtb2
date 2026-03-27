"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, QrCode } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MfaCheckVerifiedResponse { verified: boolean; }
interface MfaSetupResponse         { qrCodeUrl: string; secret: string; }
interface MfaVerifyResponse        { success: boolean; }
interface MfaVerifyError           { error: string; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function MfaSetupPage() {
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

  // ── Generate QR code on mount ──────────────────────────────────────────
  const {
    data:      setupData,
    isLoading: isGenerating,
    isError:   setupFailed,
  } = useQuery<MfaSetupResponse>({
    queryKey: ["mfa-setup"],
    queryFn:  () =>
      axios
        .post<MfaSetupResponse>("/api/admin/mfa/setup")
        .then((r) => r.data)
        .catch((err: AxiosError) => {
          // MFA already set up — redirect to verify
          if (err.response?.status === 400) {
            router.push("/mfa-verify");
          }
          throw err;
        }),
    staleTime: Infinity, // No need to re-fetch during session
    retry:     false,
  });

  // ── Verify OTP mutation ────────────────────────────────────────────────
  const verifyMutation = useMutation<MfaVerifyResponse, AxiosError<MfaVerifyError>, string>({
    mutationFn: (otpCode) =>
      axios
        .post<MfaVerifyResponse>("/api/admin/mfa/verify", { otp: otpCode, isSetup: true })
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

  const isVerifying = verifyMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup 2FA</h1>
          <p className="text-gray-500 text-sm">
            Scan this QR code with Google Authenticator app
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {isGenerating ? (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : setupFailed ? (
            <div className="w-48 h-48 bg-red-50 rounded-xl flex items-center justify-center">
              <p className="text-red-400 text-sm text-center px-4">Failed to generate QR code. Please refresh.</p>
            </div>
          ) : setupData?.qrCodeUrl ? (
            <div className="border-4 border-white shadow-lg rounded-xl overflow-hidden">
              <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          ) : null}
        </div>

        {/* Manual secret key */}
        {setupData?.secret && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Manual Entry Key
            </p>
            <p className="text-sm font-mono font-bold text-gray-800 break-all select-all">
              {setupData.secret}
            </p>
          </div>
        )}

        {/* Steps */}
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Install <span className="font-semibold">Google Authenticator</span> on your phone</li>
          <li>Tap <span className="font-semibold">+</span> → <span className="font-semibold">Scan QR code</span></li>
          <li>Enter the 6-digit code below</li>
        </ol>

        {/* OTP Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Verification Code</label>
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

        {/* Submit */}
        <button
          onClick={handleVerify}
          disabled={isVerifying || otp.length !== 6}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {isVerifying ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
          ) : (
            <><ShieldCheck className="w-5 h-5" /> Enable 2FA</>
          )}
        </button>
      </div>
    </div>
  );
}