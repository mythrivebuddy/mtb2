export type PaymentConfigResponse = {
  success: boolean;
  cashfree: {
    mode: "prod" | "sandbox";
    baseUrl: string;
  };
  razorpay: {
    mode: "test" | "live";
  };
};