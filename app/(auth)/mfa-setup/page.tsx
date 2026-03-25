"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck, QrCode } from "lucide-react"

export default function MfaSetupPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(true)
  const router = useRouter()

useEffect(() => {
  const check = async () => {
    const res = await fetch("/api/admin/mfa/check-verified");
    const data = await res.json();
    if (data.verified) {
      router.replace("/admin/dashboard");
    }
  };
  check();
}, []);

  // QR code generate karo on mount
  useEffect(() => {
    const setup = async () => {
      try {
        const res = await fetch("/api/admin/mfa/setup", { method: "POST" })

        if (res.status === 400) {
        router.push("/mfa-verify")
        return
      }
        const data = await res.json()
        setQrCodeUrl(data.qrCodeUrl)
        setSecret(data.secret)
      } catch {
        setError("Failed to generate QR code. Please refresh.")
      } finally {
        setIsGenerating(false)
      }
    }
    setup()
  }, [])

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, isSetup: true }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Invalid OTP")
        return
      }

      router.push("/admin/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md space-y-6">

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
          ) : qrCodeUrl ? (
            <div className="border-4 border-white shadow-lg rounded-xl overflow-hidden">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          ) : null}
        </div>

        {/* Manual secret */}
        {secret && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Manual Entry Key
            </p>
            <p className="text-sm font-mono font-bold text-gray-800 break-all select-all">
              {secret}
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
              setOtp(e.target.value.replace(/\D/g, ""))
              setError("")
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

        <button
          onClick={handleVerify}
          disabled={isLoading || otp.length !== 6}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
          ) : (
            <><ShieldCheck className="w-5 h-5" /> Enable 2FA</>
          )}
        </button>
      </div>
    </div>
  )
}