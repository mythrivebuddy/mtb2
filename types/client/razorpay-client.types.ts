  export type RazorpayCheckoutOptions = {
    key: string;
    name: string;
    description: string;
    theme: {
      color: string;
    };
    handler: (response: RazorpaySuccessResponse) => void;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    order_id?: string;
    subscription_id?: string;
    modal?: {
      ondismiss: () => void;
    };
  };
  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResponse {
    error: {
      code: string;
      description: string;
      source: string;
      step: string;
      reason: string;
      metadata: {
        order_id?: string;
        payment_id?: string;
        subscription_id?: string;
      };
    };
  }
  export interface WindowWithRazorpay extends Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (
        event: string,
        callback: (res: RazorpayErrorResponse) => void,
      ) => void;
    };
  }