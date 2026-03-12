import {
  RazorpayCheckoutOptions,
  RazorpayErrorResponse,
  RazorpaySuccessResponse,
  WindowWithRazorpay
} from "@/types/client/razorpay-client.types"

import { toast } from "sonner"

interface RazorpayOptionsPayload {
  orderId: string
  key: string
  name: string
  description: string
  prefill: {
    name: string
    email: string
    contact?: string
  }
  callbackUrl: string

  // NEW
  onDismiss?: () => void
  onFailure?: (reason: string, metadata?: {
    order_id?: string
    payment_id?: string
  }) => void
}
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as unknown as WindowWithRazorpay).Razorpay) return resolve(true)

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)

    document.body.appendChild(script)
  })
}

export const openRazorpayCheckout = async (
  payload: RazorpayOptionsPayload
) => {
  const loaded = await loadRazorpayScript()

  if (!loaded) {
    toast.error("Razorpay SDK failed to load")
    return
  }

  const RazorpayConstructor = (window as unknown as WindowWithRazorpay).Razorpay

  if (!RazorpayConstructor) {
    toast.error("Razorpay not available")
    return
  }

  const options: RazorpayCheckoutOptions = {
    key: payload.key,
    name: payload.name,
    description: payload.description,
    order_id: payload.orderId,
    theme: { color: "#0f172a" },

    handler: function (response: RazorpaySuccessResponse) {
      const url = new URL(payload.callbackUrl, window.location.origin)

      url.searchParams.set("order_id", response.razorpay_order_id!)
      url.searchParams.set("payment_id", response.razorpay_payment_id)
      url.searchParams.set("signature", response.razorpay_signature)

      window.location.href = url.toString()
    },

    prefill: {
      name: payload.prefill.name,
      email: payload.prefill.email,
      contact: payload.prefill.contact ?? "",
    },

    modal: {
      ondismiss: () => {
        if (payload.onDismiss) {
          payload.onDismiss()
          return
        }
        toast.error("Payment cancelled")
      },
    },
  }

  const rzp = new RazorpayConstructor(options)

  rzp.on("payment.failed", (response: RazorpayErrorResponse) => {
  const reason =
    response?.error?.description ||
    response?.error?.reason ||
    "payment_failed"

  if (payload.onFailure) {
    payload.onFailure(reason, response?.error?.metadata)
    return
  }

  toast.error(`Payment failed: ${reason}`)
})

  rzp.open()
}