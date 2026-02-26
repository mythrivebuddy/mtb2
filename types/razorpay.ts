export type PaymentGateway = "CASHFREE" | "RAZORPAY";

export interface CreateOrderInput {
  userId: string;
  planId: string;
  amount: number;
  currency: "INR" | "USD";
  metadata?: Record<string, any>;
}

export interface RazorpayCreateOrderResponse {
  orderId: string;
  amount: number;
  currency: "INR";
  keyId: string;
}

export interface RazorpaySubscriptionCreatePayload {
  plan_id: string;
  customer_notify?: 0 | 1;
  total_count: number;
  start_at?: number;
  expire_by?: number;
  addons?: {
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }[];
  notes?: Record<string, string>;
}