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

