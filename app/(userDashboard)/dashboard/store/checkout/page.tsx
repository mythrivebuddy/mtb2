

"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield, MapPin, User as UserIcon, Mail, Phone, Globe,
  Pencil, Check, X, AlertCircle, Info, TrendingUp, Coins, AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Item, BillingInfo } from "@/types/client/store";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { GST_REGEX } from "@/lib/constant";
import { openRazorpayCheckout } from "@/lib/razorpay/client/razorpay-client";
import { convertCurrency } from "@/lib/payment/payment.utils";

// ─── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", GP: "GP" };
const getCurrencySymbol = (currency?: string): string => CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// types/coupon.ts
type CouponType = "PERCENTAGE" | "FIXED" | "FULL_DISCOUNT";

interface AppliedCoupon {
  id: string;
  code: string;
  type: CouponType;
  discountPercentage?: number | null;
  discountAmountUSD?: number | null;
  discountAmountINR?: number | null;
  discountAmountGP?: number | null;
  freeDays?: number | null;
  description?: string | null;
}

// const CONVERSION_RATES: Record<string, Record<string, number>> = {
//   USD: { INR: 83.5, USD: 1 },
//   INR: { USD: 1 / 83.5, INR: 1 },
//   GP: { GP: 1 },
// };

// const convertPrice = (amount: number, from: string, to: string): number => {
//   if (from === to) return amount;
//   if (from === "GP" || to === "GP") return amount;
//   return amount * (CONVERSION_RATES[from]?.[to] ?? 1);
// };
const convertPrice = (
  amount: number,
  from: string,
  to: string,
  rate?: number
): number => {

  if (from === to) return amount;
  if (!rate) return amount;

  if (from === "USD" && to === "INR")
    return Math.round(amount * rate * 100) / 100;

  if (from === "INR" && to === "USD")
    return Math.round((amount / rate) * 100) / 100;

  return amount;
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const RupeeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12" /><path d="M6 8h12" /><path d="M6 13l8.5 8" /><path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const GPIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M15 9h-3.5a2.5 2.5 0 1 0 0 5h2a2.5 2.5 0 1 1 0 5H9" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_BILLING: BillingInfo = {
  fullName: "", email: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", postalCode: "", country: "IN", gstNumber: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
interface BillingFormProps {
  billing: BillingInfo;
  onSave: (data: BillingInfo) => void;
  isSaving: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
}

const BillingForm = ({ billing, onSave, isSaving, onCancel, showCancel }: BillingFormProps) => {
  const [form, setForm] = useState<BillingInfo>(billing);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: name === "gstNumber" ? value.toUpperCase() : value,
      ...(name === "country" && value !== "IN" ? { gstNumber: "" } : {})
    }))
  }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4 border-b pb-2 flex-wrap">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border" placeholder="John Doe" required />
            </div>
          </div>
          <div className="col-span-full sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange} className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border" placeholder="john@example.com" required />
            </div>
          </div>
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="tel" name="phone" value={form?.phone} onChange={handleChange} className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border" placeholder="9876543210" />
            </div>
          </div>
          {/* GST NUMBER (OPTIONAL - INDIA ONLY) */}
          {form.country === "IN" && (
            <div className="col-span-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                GST Number (Optional)
              </label>

              <input
                type="text"
                name="gstNumber"
                value={form.gstNumber || ""}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border uppercase"
              />

              <p className="text-xs text-gray-400 mt-1">
                Enter GST number if you want GST invoice for business.
              </p>
            </div>
          )}
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
            <input type="text" name="addressLine1" value={form.addressLine1} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" placeholder="Street Address" required />
          </div>
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
            <input type="text" name="addressLine2" value={form.addressLine2} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" placeholder="Apartment, suite, unit, etc." />
          </div>
          <div className="col-span-full grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              <input type="text" name="city" value={form.city} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              <input type="text" name="state" value={form.state} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code <span className="text-red-500">*</span></label>
              <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select name="country" value={form.country} onChange={handleChange} className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border bg-white">
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="CA">Canada</option>
                  <option value="OT">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSaving ? "Saving..." : <><Check className="w-4 h-4" /> Save Address</>}
          </button>
          {showCancel && onCancel && (
            <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

const BillingSummary = ({ billing, onEdit }: { billing: BillingInfo; onEdit: () => void }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex justify-between items-start">
      <div className="space-y-0.5">
        <h2 className="font-bold flex items-center gap-1">2. DELIVERY ADDRESS <span className="text-green-500">✓</span></h2>
        <p className="text-gray-800 font-medium">{billing.fullName}</p>
        <p className="text-gray-600 text-sm">
          {billing.addressLine1}{billing.addressLine2 ? `, ${billing.addressLine2}` : ""}, {billing.city}, {billing.state} — {billing.postalCode}, {billing.country}
        </p>
        {billing.phone && <p className="text-gray-500 text-sm">📞 {billing.phone}</p>}
        <p className="text-gray-500 text-sm">✉️ {billing.email}</p>
        {billing.gstNumber && (
          <p className="text-gray-500 text-sm">GST: {billing.gstNumber}</p>
        )}
      </div>
      <button onClick={onEdit} className="flex items-center gap-1 text-blue-600 font-medium text-sm hover:text-blue-800 shrink-0 sm:ml-4">
        <Pencil className="w-3.5 h-3.5" /> CHANGE
      </button>
    </div>
  </div>
);

const CurrencyIcon = ({ currency, className }: { currency: string; className?: string }) => {
  switch (currency) {
    case "INR": return <RupeeIcon className={className} />;
    case "USD": return <DollarIcon className={className} />;
    case "GP": return <GPIcon className={className} />;
    default: return <RupeeIcon className={className} />;
  }
};

const GPBalanceBanner = ({ gpBalance, requiredGP, isInsufficient }: { gpBalance: number; requiredGP: number; isInsufficient: boolean }) => (
  <div className={`rounded-xl border-2 p-4 ${isInsufficient ? "bg-red-50 border-red-400" : "bg-purple-50 border-purple-300"}`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${isInsufficient ? "bg-red-500" : "bg-purple-500"}`}>
        {isInsufficient ? <AlertTriangle className="w-5 h-5 text-white" /> : <Coins className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1">
        <p className={`font-bold text-sm mb-1 ${isInsufficient ? "text-red-900" : "text-purple-900"}`}>
          {isInsufficient ? "⚠️ Insufficient GP Balance" : "✅ GP Balance Available"}
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className={`font-medium ${isInsufficient ? "text-red-800" : "text-purple-800"}`}>
            Your Balance: <strong>{Math.floor(gpBalance)} GP</strong>
          </span>
          <span className={`font-medium ${isInsufficient ? "text-red-800" : "text-purple-800"}`}>
            Required: <strong>{Math.ceil(requiredGP)} GP</strong>
          </span>
          {isInsufficient && (
            <span className="font-bold text-red-700">
              Short by: {Math.ceil(requiredGP) - Math.floor(gpBalance)} GP
            </span>
          )}
        </div>
        {isInsufficient && (
          <p className="text-xs text-red-700 mt-2">
            You don t have enough GP to complete this purchase. Earn more GP by completing activities on the platform.
          </p>
        )}
      </div>
    </div>
  </div>
);

// ─── Main Checkout Content ────────────────────────────────────────────────────
const CheckoutContent = () => {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();



  // ── useState — always first, always unconditional ─────────────────────────
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD" | "GP" | null>(null);
  const [manualCouponCode, setManualCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [autoCoupon, setAutoCoupon] = useState<AppliedCoupon | null>(null);

  const [isAutoCouponLoading, setIsAutoCouponLoading] = useState(false);
  const [autoCouponChecked, setAutoCouponChecked] = useState(false);

  // ── useMemo — stable references, no hooks inside ──────────────────────────

  const cartItems = useMemo(() => searchParams.getAll("cartItem"), [searchParams]);
  console.log({ cartItems });

  const parsedCartItems = useMemo(
    () => cartItems.map((item) => {
      const [itemId, quantity] = item.split(":");
      return { itemId, quantity: parseInt(quantity) };
    }),
    [cartItems]
  );

  // ── useQuery ──────────────────────────────────────────────────────────────
  const { data: items, isLoading: isItemsLoading } = useQuery({
    queryKey: ["checkoutItems", cartItems],
    queryFn: async () => {
      const results = await Promise.all(
        parsedCartItems.map(({ itemId }) =>
          axios.get(`/api/user/store/items/get-item?itemId=${itemId}`).then((r) => r.data.item as Item)
        )
      );
      return results;
    },
    enabled: cartItems.length > 0,
  });



  const { data: billingData, isLoading: isBillingLoading, refetch: refetchBilling } = useQuery({
    queryKey: ["billingInfo"],
    queryFn: async () => {
      const res = await axios.get("/api/user/store/items/checkout/billinginfo");
      return res.data.billingInfo as BillingInfo | null;
    },
  });

  const { data: gpData, isLoading: isGPLoading } = useQuery({
    queryKey: ["gpBalance"],
    queryFn: async () => {
      const res = await axios.get("/api/user/store/items/gp-balance");
      return res.data as { balance: number; earned: number; spent: number };
    },
  });
  const { data: usdToInrRate } = useQuery({
    queryKey: ["usdToInrRate"],
    queryFn: async () => convertCurrency(1, "USD", "INR"),
    enabled: selectedCurrency !== "GP"
  });

  // ── useMutation ───────────────────────────────────────────────────────────
  const saveBillingMutation = useMutation({
    mutationFn: async (data: BillingInfo) => {
      const gst = data.gstNumber?.trim()

      if (data.country === "IN" && gst && !GST_REGEX.test(gst)) {
        toast.error("Invalid GST Number format")
        return;
      }
      const res = await axios.post("/api/user/store/items/checkout/billinginfo", data);
      return res.data.billingInfo as BillingInfo;
    },
    onSuccess: () => {
      toast.success("Address saved!");
      setIsEditingBilling(false);
      refetchBilling();
    },
    onError: (error) => toast.error(getAxiosErrorMessage(error, "Failed to save address")),
  });

  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!selectedCurrency) throw new Error("Currency not selected");
      if (hasMultipleDifferentProducts) return;

      const res = await axios.post("/api/coupons/verify", {
        code,
        currency: selectedCurrency,
        storeItemId: parsedCartItems[0]?.itemId,
      });

      return res.data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        toast.success("Coupon applied");
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to apply coupon");
    },
  });

  // const placeOrderMutation = useMutation({
  //   mutationFn: async () => {
  //     if (!selectedCurrency) throw new Error("Currency not selected");
  //     await axios.post("/api/user/store/items/place-order", {
  //       items: parsedCartItems.map(({ itemId, quantity }) => ({ itemId, quantity })),
  //       currency: selectedCurrency,
  //     });
  //   },
  //   onSuccess: () => {
  //     toast.success("Order placed successfully!");
  //     router.push("/dashboard/store/profile");
  //   },
  //   onError: (error) => toast.error(getAxiosErrorMessage(error, "Failed to place order")),
  // });
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCurrency) throw new Error("Currency not selected")

      const res = await axios.post(
        "/api/billing/razorpay/store/create-order",
        {
          context: "STORE_PRODUCT",
          items: parsedCartItems.map(({ itemId, quantity }) => ({
            itemId,
            quantity,
          })),
          currency: selectedCurrency,
          couponCode: appliedCoupon?.code || null,
          exchangeRate: usdToInrRate ?? null,
        }
      )

      return res.data
    },


    onSuccess: async (data) => {
      try {
        if (data.type === "WALLET") {
          toast.success("Purchase completed successfully!");

          window.location.href =
            `/dashboard/store/profile?orderId=${data.order.id}`;

          return;
        }
        await openRazorpayCheckout({
          orderId: data.orderId,
          key: data.key,
          name: "mythrivebuddy.com",
          description: "Store Purchase",

          prefill: {
            name: session?.user?.name || "",
            email: session?.user?.email || "",
            contact: "",
          },

          callbackUrl: "/api/billing/razorpay/challenge/callback",

          onDismiss: () => {
            window.location.href =
              `/dashboard/membership/failure?type=store_product` +
              `&reason=checkout_closed`
          },

          onFailure: (reason, metadata) => {
            window.location.href =
              `/dashboard/membership/failure?type=store_product` +
              (metadata?.order_id ? `&orderId=${metadata.order_id}` : "") +
              `&reason=${encodeURIComponent(reason)}`
          }
        })
      } catch (err) {
        console.error("Error initiating Razorpay checkout:", err);
        toast.error("Failed to start payment .")
      }
    },

    onError: (error) =>
      toast.error(getAxiosErrorMessage(error, "Failed to initiate payment")),
  })
  // ── Derived values via useMemo — stable, no new arrays each render ────────
  const itemCurrencies = useMemo(
    () => items?.map((item) => item.currency || "INR") ?? [],
    [items]
  );

  const uniqueCurrencies = useMemo(
    () => [...new Set(itemCurrencies)],
    [itemCurrencies]
  );

  const isMixedCurrency = uniqueCurrencies.length > 1;
  const isGPCart = uniqueCurrencies.length === 1 && uniqueCurrencies[0] === "GP";

  const gpBalance = gpData?.balance ?? 0;

  const gpTotal = useMemo(() => {
    if (!isGPCart || !items) return 0;

    return items.reduce((sum, item, i) => {
      const raw = item.basePrice * parsedCartItems[i].quantity;
      let final = raw;

      if (appliedCoupon) {
        if (appliedCoupon.type === "PERCENTAGE") {
          final = raw - (raw * (appliedCoupon.discountPercentage || 0)) / 100;
        }

        if (appliedCoupon.type === "FIXED") {
          final = raw - (appliedCoupon.discountAmountGP || 0);
        }

        if (appliedCoupon.type === "FULL_DISCOUNT") {
          final = 0;
        }

        if (final < 0) final = 0;
      }

      return sum + final;
    }, 0);
  }, [isGPCart, items, parsedCartItems, appliedCoupon]);

  const isGPInsufficient = isGPCart && gpBalance < gpTotal;

  const savedBilling: BillingInfo | null = billingData ?? null;
  const hasBilling = !!savedBilling?.addressLine1;

  const defaultBilling: BillingInfo = {
    ...EMPTY_BILLING,
    fullName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  };

  const editBilling: BillingInfo = savedBilling
    ? { ...savedBilling, fullName: session?.user?.name ?? "", email: session?.user?.email ?? "" }
    : defaultBilling;

  const displayBilling: BillingInfo | null = savedBilling
    ? { ...savedBilling, fullName: session?.user?.name ?? savedBilling.fullName, email: session?.user?.email ?? savedBilling.email }
    : null;

  useEffect(() => {
    const applyAutoCoupon = async () => {
      if (!selectedCurrency || !displayBilling) return;

      if (hasMultipleDifferentProducts) {
        setAppliedCoupon(null);
        setAutoCoupon(null);
        setAutoCouponChecked(true);
        return;
      }
      try {
        setIsAutoCouponLoading(true);
        setAutoCouponChecked(false);
        console.log("cartItems raw:", cartItems);
        console.log("parsedCartItems:", parsedCartItems);
        console.log("First itemId:", parsedCartItems[0]?.itemId);
        console.log({
          currency: selectedCurrency,
          billingCountry: displayBilling.country,
          userType: session?.user?.userType,
          userId: session?.user?.id,
          storeItemId: parsedCartItems[0]?.itemId,
        });


        const res = await axios.post("/api/coupons/auto-apply", {
          currency: selectedCurrency,
          billingCountry: displayBilling.country,
          userType: session?.user?.userType,
          userId: session?.user?.id,
          storeItemId: parsedCartItems[0]?.itemId,
        });

        if (res.data?.coupon) {
          setAutoCoupon(res.data.coupon);
          setAppliedCoupon(res.data.coupon);
          setManualCouponCode(res.data.coupon.code);
        } else {
          setAutoCoupon(null);
        }
      } catch (err) {
        console.error("Auto coupon failed", err);
      } finally {
        setIsAutoCouponLoading(false);
        setAutoCouponChecked(true);
      }
    };

    applyAutoCoupon();
  }, [selectedCurrency, displayBilling?.country]);
  // ── useEffect — stable deps now that uniqueCurrencies is memoized ─────────
  useEffect(() => {

    if (!items || !displayBilling) return;

    // GP always GP
    if (uniqueCurrencies.length === 1 && uniqueCurrencies[0] === "GP") {
      setSelectedCurrency("GP");
      return;
    }

    // SINGLE ITEM → auto by country
    if (items.length === 1) {
      const newCurrency = displayBilling.country === "IN" ? "INR" : "USD";

      if (selectedCurrency !== newCurrency) {
        setSelectedCurrency(newCurrency);
      }

      return;
    }

    // MULTIPLE ITEMS SAME CURRENCY
    if (!isMixedCurrency && uniqueCurrencies.length === 1) {
      const newCurrency = uniqueCurrencies[0] as "INR" | "USD";

      if (selectedCurrency !== newCurrency) {
        setSelectedCurrency(newCurrency);
      }
    }

  }, [
    items,
    displayBilling?.country,
    uniqueCurrencies,
    isMixedCurrency
  ]);



  const hasMultipleDifferentProducts = useMemo(() => {
    if (!items) return false;
    const uniqueProductIds = new Set(items.map(i => i.id));
    return uniqueProductIds.size > 1;
  }, [items]);

  const GST_RATE = 0.18;

  const isIndianGSTApplicable =
    displayBilling?.country === "IN" &&
    !isGPCart;

  const singleTotal = useMemo(() => {
    if (!selectedCurrency || !items) return null;

    return {
      currency: selectedCurrency,
      total: items.reduce((sum, item, i) => {
        const itemCurrency = item.currency || "INR";
        const qty = parsedCartItems[i].quantity;

        const unitPrice = convertPrice(
          item.basePrice,
          itemCurrency,
          selectedCurrency,
          usdToInrRate
        );

        return sum + unitPrice * qty;
      }, 0),
    };
  }, [selectedCurrency, items, parsedCartItems, usdToInrRate]);

  // 1. Discount
  const discountAmount = useMemo(() => {
    if (!appliedCoupon || !singleTotal) return 0;

    let discount = 0;
    const total = singleTotal.total;

    if (appliedCoupon.type === "PERCENTAGE") {
      discount = (total * (appliedCoupon.discountPercentage || 0)) / 100;
    }

    if (appliedCoupon.type === "FIXED") {
      if (singleTotal.currency === "USD") {
        discount = appliedCoupon.discountAmountUSD || 0;
      }
      if (singleTotal.currency === "INR") {
        discount = appliedCoupon.discountAmountINR || 0;
      }
      if (singleTotal.currency === "GP") {
        discount = appliedCoupon.discountAmountGP || 0;
      }
    }
    if (appliedCoupon.type === "FULL_DISCOUNT") {
      discount = total;
    }

    if (discount > total) discount = total;

    return Number(discount.toFixed(2)); // round ONLY here
  }, [appliedCoupon, singleTotal]);

  // 2. Discounted total
  const discountedTotal = useMemo(() => {
    if (!singleTotal) return 0;
    return Math.max(singleTotal.total - discountAmount, 0);
  }, [singleTotal, discountAmount]);

  const gstAmount = useMemo(() => {
    if (!isIndianGSTApplicable) return 0;
    return Number((discountedTotal * GST_RATE).toFixed(2));
  }, [discountedTotal, isIndianGSTApplicable]);

  const isFullDiscountApplied =
    appliedCoupon?.type === "FULL_DISCOUNT" &&
    discountedTotal === 0;

  // 4. Final payable
  const finalPayable = useMemo(() => {
    if (!singleTotal) return 0;

    const total = discountedTotal + gstAmount;

    // Payment gateways cannot process 0 amount that's why we charge 1 unit 
    if (total <= 0) {
      if (singleTotal.currency === "INR") return 1;
      if (singleTotal.currency === "USD") return 1;
      return 0;
    }

    return Number(total.toFixed(2));;
  }, [discountedTotal, gstAmount, singleTotal]);



  if (status === "loading") {
    return <PageLoader />
  }
  // ── ALL hooks above this line — early returns are safe below ──────────────
  const isLoading =
    isItemsLoading ||
    isBillingLoading ||
    isGPLoading ||
    (selectedCurrency !== null && !autoCouponChecked);
  if (isLoading) return (
    <div className="flex min-h-screen justify-center items-center">
      <PageLoader />
    </div>
  )

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">No items found</h1>
        <Link href="/dashboard/store" className="text-blue-600 hover:underline mt-4 inline-block">Return to Store</Link>
      </div>
    );
  }

  // ── Pure derived values (no hooks) ────────────────────────────────────────


  const getDisplayPrice = (item: Item, index: number) => {
    const itemCurrency = item.currency || "INR";
    const rawPrice = item.basePrice * parsedCartItems[index].quantity;
    if (itemCurrency === "GP") {
      let finalPrice = rawPrice;

      if (appliedCoupon) {
        if (appliedCoupon.type === "PERCENTAGE") {
          finalPrice =
            rawPrice -
            (rawPrice * (appliedCoupon.discountPercentage || 0)) / 100;
        }

        if (appliedCoupon.type === "FIXED") {
          finalPrice = rawPrice - (appliedCoupon.discountAmountGP || 0);
        }

        if (appliedCoupon.type === "FULL_DISCOUNT") {
          finalPrice = 0;
        }

        if (finalPrice < 0) finalPrice = 0;
      }

      return {
        price: finalPrice,
        symbol: "GP ",
        currency: "GP",
        isConverted: false,
        originalPrice: rawPrice,
        originalCurrency: "GP",
      };
    }
    if (selectedCurrency && selectedCurrency !== "GP" && selectedCurrency !== itemCurrency) {
      return {
        price: convertPrice(rawPrice, itemCurrency, selectedCurrency, usdToInrRate),
        symbol: getCurrencySymbol(selectedCurrency),
        currency: selectedCurrency,
        isConverted: true,
        originalPrice: rawPrice,
        originalCurrency: itemCurrency,
      };
    }
    return { price: rawPrice, symbol: getCurrencySymbol(itemCurrency), currency: itemCurrency, isConverted: false, originalPrice: rawPrice, originalCurrency: itemCurrency };
  };

  const totalsByCurrency: Record<string, number> = {};
  items.forEach((item, i) => {
    const c = item.currency || "INR";
    const rawPrice = item.basePrice * parsedCartItems[i].quantity;
    totalsByCurrency[c] = (totalsByCurrency[c] || 0) + rawPrice;
  });


  const canProceed = hasBilling && !isEditingBilling && selectedCurrency !== null && !isGPInsufficient;

  console.log(autoCoupon, isAutoCouponLoading)


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mb-3 mt-3 px-4">
        <Link href="/dashboard/store" className="bg-jp-orange text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-red-600">
          Back to Growth Store
        </Link>
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ───────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* 1. Login */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold">1. LOGIN ✓</h2>
              <p className="text-gray-600 text-sm mt-1">
                Signed in as <span className="font-medium">{session?.user?.name}</span> ({session?.user?.email})
              </p>
            </div>

            {/* 2. Delivery Address */}
            {!hasBilling || isEditingBilling ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-500 px-1">
                  {isEditingBilling ? "2. DELIVERY ADDRESS — Edit" : "2. DELIVERY ADDRESS — Add your address to continue"}
                </p>
                <BillingForm
                  key={isEditingBilling ? "edit" : "add"}
                  billing={editBilling}
                  onSave={(data) => saveBillingMutation.mutate(data)}
                  isSaving={saveBillingMutation.isPending}
                  showCancel={isEditingBilling && hasBilling}
                  onCancel={() => setIsEditingBilling(false)}
                />
              </div>
            ) : (
              <BillingSummary billing={displayBilling!} onEdit={() => setIsEditingBilling(true)} />
            )}

            {/* 3. GP Balance — only for GP carts */}
            {isGPCart && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-500 px-1">3. GP BALANCE</p>
                <GPBalanceBanner gpBalance={gpBalance} requiredGP={gpTotal} isInsufficient={isGPInsufficient} />
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-purple-800 font-medium">
                    GP items can only be purchased with GP. GP cannot be converted to INR or USD.
                  </p>
                </div>
              </div>
            )}

            {/* 3/4. Currency Selection — only for mixed non-GP carts */}
            {isMixedCurrency && items.length > 1 && !itemCurrencies.includes("GP") && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl shadow-md border-2 border-orange-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-600 rounded-lg animate-pulse">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      3. SELECT PAYMENT CURRENCY
                      {!selectedCurrency && <span className="text-red-600 text-sm">*REQUIRED</span>}
                      {selectedCurrency && <span className="text-green-600 text-sm">✓</span>}
                    </h2>
                    <p className="text-sm text-gray-700 font-medium">
                      Your cart has items in multiple currencies. Choose one to proceed.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 border-2 border-orange-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700 w-full">
                      <p className="font-bold mb-2 text-orange-900">Current Cart Breakdown:</p>
                      <div className="space-y-1">
                        {Object.entries(totalsByCurrency).map(([currency, total]) => {
                          const count = itemCurrencies.filter((ic) => ic === currency).length;
                          return (
                            <div key={currency} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                              <span className="flex items-center gap-2">
                                <CurrencyIcon currency={currency} className="w-4 h-4" />
                                <span className="font-medium">{count} item{count > 1 ? "s" : ""} in {currency}</span>
                              </span>
                              <span className="font-bold text-gray-900">
                                {currency === "GP" ? `${Math.ceil(total)} GP` : `${getCurrencySymbol(currency)}${Number(total).toFixed(2)}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-900 mb-4 font-bold">⚠️ Select the currency you want to pay in:</p>

                <div className="grid grid-cols-2 gap-4">
                  {uniqueCurrencies.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => setSelectedCurrency(currency as "INR" | "USD" | "GP")}
                      className={`p-5 rounded-xl border-2 transition-all duration-200 ${selectedCurrency === currency
                        ? "border-green-600 bg-green-600 text-white shadow-xl scale-105 ring-4 ring-green-200"
                        : "border-orange-300 bg-white hover:border-orange-500 hover:shadow-md"
                        }`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-3xl font-bold mb-2">
                          <CurrencyIcon
                            currency={currency}
                            className={`w-7 h-7 ${selectedCurrency === currency ? "text-white" : currency === "GP" ? "text-purple-600" : currency === "INR" ? "text-orange-600" : "text-green-600"}`}
                          />
                          {currency}
                        </div>
                        {selectedCurrency === currency
                          ? <div className="flex items-center justify-center gap-2 text-sm font-bold"><Check className="w-5 h-5" /> SELECTED</div>
                          : <div className="text-sm font-semibold text-gray-600">Click to Select</div>
                        }
                      </div>
                    </button>
                  ))}
                </div>

                {selectedCurrency && (
                  <div className="mt-4 bg-green-100 border-2 border-green-400 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-900 mb-1">Payment Currency Selected: {selectedCurrency}</p>
                        <p className="text-xs text-green-800">All items will be converted to {selectedCurrency} at checkout. Exchange rate: 1 USD = ₹{usdToInrRate?.toFixed(2)}</p>
                        <button onClick={() => setSelectedCurrency(null)} className="mt-2 text-xs font-semibold text-green-700 hover:text-green-900 underline">
                          Change Currency
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedCurrency && (
                  <div className="mt-4 bg-red-100 border-2 border-red-400 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-900 mb-1">Currency Selection Required</p>
                        <p className="text-xs text-red-800">You must select a payment currency before placing your order.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
              <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
                <span className="text-gray-400">{isGPCart ? "4" : isMixedCurrency ? "4" : "3"}.</span>
                ORDER SUMMARY
              </h2>

              {selectedCurrency && isMixedCurrency && selectedCurrency !== "GP" && (
                <div className="mb-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-green-900 mb-1">Paying in {selectedCurrency}</p>
                      <p className="text-sm text-green-800">All prices converted using rate: 1 USD = ₹{usdToInrRate?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {items.map((item, index) => {
                  const originalCurrency = item.currency || "INR";
                  const displayData = getDisplayPrice(item, index);
                  const unitPrice = displayData.price / parsedCartItems[index].quantity;
                  const originalUnitPrice = item.basePrice;
                  const isGP = originalCurrency === "GP";

                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 pb-5 border-b border-gray-200 last:border-b-0">
                      <div className="relative flex-shrink-0">
                        <Image src={item.imageUrl} alt={item.name} width={120} height={120} className="w-full h-full sm:w-28 sm:h-28 object-cover rounded-lg shadow-sm" />
                        <span className={`absolute -top-2 -left-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 ${isGP ? "bg-purple-500 text-white border-purple-600"
                          : originalCurrency === "INR" ? "bg-orange-500 text-white border-orange-600"
                            : "bg-green-500 text-white border-green-600"
                          }`}>
                          <CurrencyIcon currency={originalCurrency} className="w-3 h-3" />
                          {originalCurrency}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{item.category.name} • Qty: {parsedCartItems[index].quantity}</p>

                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`text-2xl font-bold ${isGP ? "text-purple-700" : "text-gray-900"}`}>
                              {isGP ? `${Math.ceil(unitPrice)} GP` : `${displayData.symbol}${Number(unitPrice).toFixed(2)}`}
                            </span>
                            <span className="text-sm text-gray-500">per item</span>
                          </div>

                          {isGP && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex items-center gap-2">
                              <GPIcon className="w-4 h-4 text-purple-600" />
                              <p className="text-purple-800 font-medium text-xs">GP item — paid exclusively with Growth Points</p>
                            </div>
                          )}

                          {displayData.isConverted && !isGP && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <p className="text-blue-900 font-medium">Converted from {originalCurrency}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-blue-800">
                                    <span>Original: {getCurrencySymbol(originalCurrency)}{Number(originalUnitPrice).toFixed(2)}</span>
                                    <span className="text-blue-400">→</span>
                                    <span>Now: {displayData.symbol}{Number(unitPrice).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-600 font-medium">
                              Subtotal ({parsedCartItems[index].quantity} {parsedCartItems[index].quantity > 1 ? "items" : "item"}):
                            </span>
                            <span className={`text-lg font-bold ${isGP ? "text-purple-700" : "text-gray-900"}`}>
                              {isGP
                                ? `${Math.ceil(displayData.price)} GP`
                                : `${displayData.symbol}${Number(displayData.price).toFixed(2)}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right Column ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            {!hasMultipleDifferentProducts && (
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <h3 className="font-semibold mb-2">Apply Coupon</h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCouponCode}
                    onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="border px-3 py-2 rounded-md w-full"
                  />
                  <button
                    onClick={() => applyCouponMutation.mutate(manualCouponCode)}
                    disabled={applyCouponMutation.isPending || !manualCouponCode}
                    className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 min-w-[110px] font-medium transition-all
    ${applyCouponMutation.isPending
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                      }`}
                  >
                    {applyCouponMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>

                {appliedCoupon && (
                  <p className="text-green-600 text-sm mt-2">
                    Coupon <strong>{appliedCoupon.code}</strong> applied
                  </p>
                )}
              </div>
            )}
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4">
              <h2 className="text-gray-700 font-bold text-lg mb-5 border-b pb-3">PRICE DETAILS</h2>

              <div className="space-y-4 mb-5">
                {singleTotal ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Total ({parsedCartItems.reduce((sum, i) => sum + i.quantity, 0)} items)
                      </span>
                      <span className={`text-xl font-bold ${singleTotal.currency === "GP" ? "text-purple-700" : "text-gray-900"}`}>
                        {singleTotal.currency === "GP"
                          ? `${Math.ceil(singleTotal.total)} GP`
                          : `${getCurrencySymbol(singleTotal.currency)}${Number(singleTotal.total).toFixed(2)}`}
                      </span>
                    </div>
                    {isMixedCurrency && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Original Breakdown:</p>
                        <div className="space-y-1">
                          {Object.entries(totalsByCurrency).map(([currency, total]) => (
                            <div key={currency} className="flex justify-between text-xs text-gray-600">
                              <span className="flex items-center gap-1"><CurrencyIcon currency={currency} className="w-3 h-3" />{currency}</span>
                              <span>{currency === "GP" ? `${Math.ceil(total)} GP` : `${getCurrencySymbol(currency)}${Number(total).toFixed(2)}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : isMixedCurrency ? (
                  <>
                    <div className="space-y-2">
                      {Object.entries(totalsByCurrency).map(([currency, total]) => {
                        const count = itemCurrencies.filter((ic) => ic === currency).length;
                        return (
                          <div key={currency} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <CurrencyIcon currency={currency} className="w-4 h-4" />
                                {currency} Items ({count})
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-gray-500">Subtotal</span>
                              <span className="text-lg font-bold text-gray-900">
                                {currency === "GP" ? `${Math.ceil(total)} GP` : `${getCurrencySymbol(currency)}${Number(total).toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                      <p className="text-xs text-red-800 flex items-start gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Please select a payment currency above to continue</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Price ({parsedCartItems.reduce((sum, i) => sum + i.quantity, 0)} items)
                    </span>
                    <span className={`text-xl font-bold ${uniqueCurrencies[0] === "GP" ? "text-purple-700" : "text-gray-900"}`}>
                      {uniqueCurrencies[0] === "GP"
                        ? `${Math.ceil(Object.values(totalsByCurrency)[0])} GP`
                        : `${getCurrencySymbol(uniqueCurrencies[0])}${Number(Object.values(totalsByCurrency)[0]).toFixed(2)}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">Delivery Charges</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                {appliedCoupon && selectedCurrency && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span className="font-bold">
                      {selectedCurrency === "GP"
                        ? `-${Math.ceil(discountAmount)} GP`
                        : `-${getCurrencySymbol(selectedCurrency)}${discountAmount.toFixed(2)}`
                      }
                    </span>
                  </div>
                )}
                {isIndianGSTApplicable && selectedCurrency && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">GST (18%)</span>
                    <span className="text-gray-900 font-bold">
                      {selectedCurrency ? getCurrencySymbol(selectedCurrency) : " "}{gstAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {isFullDiscountApplied && selectedCurrency !== "GP" && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="font-medium">Minimal Processing Fee</span>
                    <span className="font-bold">
                      {selectedCurrency ? getCurrencySymbol(selectedCurrency) : " "}1.00
                    </span>
                  </div>
                )}
              </div>

              {/* Total Payable */}
              <div className="pt-4 border-t-2 border-gray-300 mb-5">
                {singleTotal ? (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Payable</span>
                    <span className={`text-2xl font-bold ${singleTotal.currency === "GP" ? "text-purple-600" : "text-green-600"}`}>
                      {singleTotal.currency === "GP"
                        ? `${Math.ceil(finalPayable)} GP`
                        : `${getCurrencySymbol(singleTotal.currency)}${(finalPayable).toFixed(2)}`}
                    </span>
                  </div>
                ) : isMixedCurrency ? (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <p className="text-sm font-bold text-red-900 text-center">Select currency to see total</p>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Payable</span>
                    <span className={`text-2xl font-bold ${uniqueCurrencies[0] === "GP" ? "text-purple-600" : "text-green-600"}`}>
                      {uniqueCurrencies[0] === "GP"
                        ? `${Math.ceil(Object.values(totalsByCurrency)[0])} GP`
                        : `${getCurrencySymbol(uniqueCurrencies[0])}${Number(Object.values(totalsByCurrency)[0]).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {isGPInsufficient && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-800 font-bold">Insufficient GP Balance</p>
                        <p className="text-xs text-red-700 mt-0.5">
                          You need {Math.ceil(gpTotal)} GP but only have {Math.floor(gpBalance)} GP.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!hasBilling && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-medium">Please add your delivery address above to continue.</p>
                    </div>
                  </div>
                )}

                {isEditingBilling && hasBilling && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-medium">Save your address changes to continue.</p>
                    </div>
                  </div>
                )}

                {isMixedCurrency && !selectedCurrency && hasBilling && !isEditingBilling && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 animate-pulse">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 font-bold">Select a payment currency above to place your order.</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                  <Shield className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-gray-900">Safe and Secure Payments.</span> Easy returns. 100% Authentic products.
                  </p>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  By continuing with the order, you confirm that you are above 18 years of age, and you agree to the My Thrive Buddy{" "}
                  <Link href="#" className="text-blue-600 hover:underline font-medium">Terms of Use</Link> and{" "}
                  <Link href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>
                </p>

                <button
                  onClick={() => placeOrderMutation.mutate()}
                  disabled={!canProceed || placeOrderMutation.isPending}
                  className={`w-full py-4 text-white font-bold text-lg rounded-xl transition-all duration-200 ${!canProceed || placeOrderMutation.isPending
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    }`}
                >
                  {placeOrderMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Placing Order...
                    </span>
                  ) : isGPInsufficient ? "Insufficient GP Balance" : "Place Order"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Page Export ──────────────────────────────────────────────────────────────
const CheckoutPage = () => (
  <div className="w-full h-full">
    <Suspense fallback={<PageLoader />}>
      <CheckoutContent />
    </Suspense>
  </div>
);

export default CheckoutPage;