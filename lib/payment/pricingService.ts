import { calculateDiscount, calculateFinal } from "@/lib/payment/payment.utils";
import { Coupon } from "@prisma/client";

export function calculatePayment({
  baseAmount,
  coupon,
  currency,
  isIndia,
}: {
  baseAmount: number;
  coupon: Coupon | null;
  currency: "INR" | "USD";
  isIndia: boolean;
}) {
  const discount = calculateDiscount(baseAmount, coupon, currency);

  let totalAmount = calculateFinal(
    baseAmount,
    discount,
    isIndia,
    true,
    0.18
  );

  if (totalAmount <= 0) totalAmount = 1;

  const gstRate = isIndia ? 0.18 : 0;
  const gst = (baseAmount - discount) * gstRate;

  return {
    discount,
    totalAmount,
    gst,
  };
}