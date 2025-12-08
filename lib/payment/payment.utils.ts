type CashfreeOrderResponse = {
  order_status?: string;
  order_status_description?: string;
  payment_message?: string;
  payment?: {
    graphical_status_message?: string;
    error_text?: string;
    bank_error_message?: string;
  };
};

type CashfreeSubscriptionResponse = {
  subscription_status?: string;
  subscription_status_description?: string;
  subscription_failure_reason?: string;
  last_payment?: {
    failure_reason?: string;
    payment_method?: string;
  };
};

// ==========================================================
// Extract failure message from ORDER (Lifetime Payment)
// ==========================================================
export function extractOrderFailureReason(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Payment failed";
  }

  const d = data as CashfreeOrderResponse;

  return (
    d.order_status_description ||
    d.payment_message ||
    d.payment?.graphical_status_message ||
    d.payment?.error_text ||
    d.payment?.bank_error_message ||
    d.order_status ||
    "Payment failed"
  );
}

// ==========================================================
// Extract failure message from SUBSCRIPTION / MANDATE
// ==========================================================
export function extractMandateFailureReason(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Mandate setup failed";
  }

  const d = data as CashfreeSubscriptionResponse;

  return (
    d.last_payment?.failure_reason ||
    d.subscription_failure_reason ||
    d.subscription_status_description ||
    d.subscription_status ||
    "Mandate setup failed"
  );
}
