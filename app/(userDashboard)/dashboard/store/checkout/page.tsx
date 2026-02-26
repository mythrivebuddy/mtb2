"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  MapPin,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  Pencil,
  Check,
  X,
  AlertCircle,
  Eye,
  Info,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Item } from "@/types/client/store";
import Image from "next/image";
import { useSession } from "next-auth/react";

// ─── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// Approximate static conversion rates (USD <-> INR)
const CONVERSION_RATES: Record<string, Record<string, number>> = {
  USD: { INR: 83.5, USD: 1 },
  INR: { USD: 1 / 83.5, INR: 1 },
};

const convertPrice = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  return amount * (CONVERSION_RATES[from]?.[to] ?? 1);
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const RupeeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingInfo {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_BILLING: BillingInfo = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
};

// ─── Billing Form Component ───────────────────────────────────────────────────

interface BillingFormProps {
  billing: BillingInfo;
  onSave: (data: BillingInfo) => void;
  isSaving: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
}

const BillingForm = ({
  billing,
  onSave,
  isSaving,
  onCancel,
  showCancel,
}: BillingFormProps) => {
  const [form, setForm] = useState<BillingInfo>(billing);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4 border-b pb-2 flex-wrap">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Billing Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="col-span-full sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="col-span-full sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              placeholder="Street Address"
              required
            />
          </div>

          {/* Address Line 2 */}
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              placeholder="Apartment, suite, unit, etc."
            />
          </div>

          {/* City / State / Postal / Country */}
          <div className="col-span-full grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border bg-white"
                >
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

        {/* Form Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Address
              </>
            )}
          </button>
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

// ─── Billing Summary (read-only view) ────────────────────────────────────────

interface BillingSummaryProps {
  billing: BillingInfo;
  onEdit: () => void;
}

const BillingSummary = ({ billing, onEdit }: BillingSummaryProps) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex justify-between items-start">
      <div className="space-y-0.5">
        <h2 className="font-bold flex items-center gap-1">
          2. DELIVERY ADDRESS <span className="text-green-500">✓</span>
        </h2>
        <p className="text-gray-800 font-medium">{billing.fullName}</p>
        <p className="text-gray-600 text-sm">
          {billing.addressLine1}
          {billing.addressLine2 ? `, ${billing.addressLine2}` : ""},{" "}
          {billing.city}, {billing.state} — {billing.postalCode},{" "}
          {billing.country}
        </p>
        {billing.phone && (
          <p className="text-gray-500 text-sm">📞 {billing.phone}</p>
        )}
        <p className="text-gray-500 text-sm">✉️ {billing.email}</p>
      </div>
      <button
        onClick={onEdit}
        className="flex items-center gap-1 text-blue-600 font-medium text-sm hover:text-blue-800 shrink-0 ml-4"
      >
        <Pencil className="w-3.5 h-3.5" />
        CHANGE
      </button>
    </div>
  </div>
);

// ─── Main Checkout Content ─────────────────────────────────────────────────────

const CheckoutContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartItems = searchParams.getAll("cartItem");
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  
  // Preview currency selection
  const [previewCurrency, setPreviewCurrency] = useState<"INR" | "USD" | null>(null);

  const { data: session } = useSession();

  const parsedCartItems = cartItems.map((item) => {
    const [itemId, quantity] = item.split(":");
    return { itemId, quantity: parseInt(quantity) };
  });

  // Fetch product items
  const { data: items, isLoading: isItemsLoading } = useQuery({
    queryKey: ["items", cartItems],
    queryFn: async () => {
      const itemsPromises = parsedCartItems.map(async ({ itemId }) => {
        const res = await axios.get(`/api/user/store/items/get-item?itemId=${itemId}`);
        return res.data.item as Item;
      });
      return Promise.all(itemsPromises);
    },
    enabled: cartItems.length > 0,
  });

  // Fetch billing info
  const {
    data: billingData,
    isLoading: isBillingLoading,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ["billingInfo"],
    queryFn: async () => {
      const res = await axios.get("/api/user/store/items/checkout/billinginfo");
      return res.data.billingInfo as BillingInfo | null;
    },
  });

  const savedBilling: BillingInfo | null = billingData ?? null;
  const hasBilling = !!savedBilling?.addressLine1;

  const defaultBilling: BillingInfo = {
    ...EMPTY_BILLING,
    fullName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  };

  const editBilling: BillingInfo = savedBilling
    ? {
        ...savedBilling,
        fullName: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
      }
    : defaultBilling;

  // Save billing mutation
  const saveBillingMutation = useMutation({
    mutationFn: async (data: BillingInfo) => {
      const res = await axios.post(
        "/api/user/store/items/checkout/billinginfo",
        data
      );
      return res.data.billingInfo as BillingInfo;
    },
    onSuccess: () => {
      toast.success("Address saved!");
      setIsEditingBilling(false);
      refetchBilling();
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error, "Failed to save address"));
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/user/store/items/place-order", {
        items: parsedCartItems.map(({ itemId, quantity }) => ({ itemId, quantity })),
      });
    },
    onSuccess: () => {
      toast.success("Order placed successfully!");
      router.push("/dashboard/store/profile");
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error, "Failed to place order"));
    },
  });

  const isLoading = isItemsLoading || isBillingLoading;
  if (isLoading) return <PageLoader />;

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">No items found</h1>
        <Link
          href="/dashboard/store"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  // ─── Currency derivation ───────────────────────────────────────────────────
  const itemCurrencies = items.map((item) => item.currency || "INR");
  const uniqueCurrencies = [...new Set(itemCurrencies)];
  const isMixedCurrency = uniqueCurrencies.length > 1;

  // ✅ Get display price for an item
  const getDisplayPrice = (item: Item, index: number) => {
    const itemCurrency = item.currency || "INR";
    const rawPrice = item.basePrice * parsedCartItems[index].quantity;

    if (previewCurrency && previewCurrency !== itemCurrency) {
      return {
        price: convertPrice(rawPrice, itemCurrency, previewCurrency),
        symbol: getCurrencySymbol(previewCurrency),
        currency: previewCurrency,
        isConverted: true,
        originalPrice: rawPrice,
        originalCurrency: itemCurrency,
      };
    }

    return {
      price: rawPrice,
      symbol: getCurrencySymbol(itemCurrency),
      currency: itemCurrency,
      isConverted: false,
      originalPrice: rawPrice,
      originalCurrency: itemCurrency,
    };
  };

  // ✅ Calculate totals by currency
  const calculateTotalsByCurrency = () => {
    const totals: Record<string, number> = {};
    items.forEach((item, i) => {
      const itemCurrency = item.currency || "INR";
      const rawPrice = item.basePrice * parsedCartItems[i].quantity;
      totals[itemCurrency] = (totals[itemCurrency] || 0) + rawPrice;
    });
    return totals;
  };

  // ✅ Calculate single total (when preview is active)
  const calculateSingleTotal = () => {
    if (!previewCurrency) return null;
    
    const total = items.reduce((sum, item, i) => {
      const itemCurrency = item.currency || "INR";
      const rawPrice = item.basePrice * parsedCartItems[i].quantity;
      return sum + convertPrice(rawPrice, itemCurrency, previewCurrency);
    }, 0);
    
    return { currency: previewCurrency, total };
  };

  const totalsByCurrency = calculateTotalsByCurrency();
  const singleTotal = calculateSingleTotal();
  const canProceed = hasBilling && !isEditingBilling;

  const displayBilling: BillingInfo | null = savedBilling
    ? {
        ...savedBilling,
        fullName: session?.user?.name ?? savedBilling.fullName,
        email: session?.user?.email ?? savedBilling.email,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mb-3 mt-3 px-4">
        <Link
          href="/dashboard/store"
          className="bg-jp-orange text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-red-600"
        >
          Back to Store
        </Link>
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* 1. Login */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold">1. LOGIN ✓</h2>
              <p className="text-gray-600 text-sm mt-1">
                Signed in as{" "}
                <span className="font-medium">{session?.user?.name}</span> (
                {session?.user?.email})
              </p>
            </div>

            {/* 2. Delivery Address */}
            {!hasBilling || isEditingBilling ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-500 px-1">
                  {isEditingBilling
                    ? "2. DELIVERY ADDRESS — Edit"
                    : "2. DELIVERY ADDRESS — Add your address to continue"}
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
              <BillingSummary
                billing={displayBilling!}
                onEdit={() => setIsEditingBilling(true)}
              />
            )}

            {/* 3. Currency Preview (Enhanced) */}
            {isMixedCurrency && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-gray-900">Currency Preview</h2>
                    <p className="text-sm text-gray-600">View prices in your preferred currency</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Your cart contains items in multiple currencies:</p>
                      <div className="space-y-1 mt-2">
                        {Object.entries(totalsByCurrency).map(([currency, total]) => {
                          const count = itemCurrencies.filter(ic => ic === currency).length;
                          return (
                            <div key={currency} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                              <span className="flex items-center gap-2">
                                {currency === "INR" ? <RupeeIcon className="w-4 h-4" /> : <DollarIcon className="w-4 h-4" />}
                                <span className="font-medium">{count} item{count > 1 ? 's' : ''} in {currency}</span>
                              </span>
                              <span className="font-bold text-gray-900">
                                {getCurrencySymbol(currency)}{Number(total).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 font-medium">
                  Select a currency to preview all prices converted:
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {uniqueCurrencies.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => setPreviewCurrency(previewCurrency === currency ? null : currency as "INR" | "USD")}
                      className={`p-4 rounded-xl border-3 transition-all duration-200 ${
                        previewCurrency === currency
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg transform scale-105"
                          : "border-gray-300 bg-white hover:border-blue-400 hover:shadow-md"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-2">
                          {currency === "INR" ? (
                            <RupeeIcon className={`w-6 h-6 ${previewCurrency === currency ? 'text-white' : 'text-orange-600'}`} />
                          ) : (
                            <DollarIcon className={`w-6 h-6 ${previewCurrency === currency ? 'text-white' : 'text-green-600'}`} />
                          )}
                          {currency}
                        </div>
                        {previewCurrency === currency ? (
                          <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                            <Check className="w-4 h-4" />
                            Preview Active
                          </div>
                        ) : (
                          <div className={`text-sm font-medium ${previewCurrency === currency ? 'text-white' : 'text-gray-600'}`}>
                            Click to Preview
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {previewCurrency && (
                  <div className="mt-4 bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900 mb-1">
                          Preview Mode Active
                        </p>
                        <p className="text-xs text-blue-800">
                          All prices are now shown in {previewCurrency}. Original prices and conversions are displayed below each item. 
                          Exchange rate: 1 USD = ₹83.50
                        </p>
                        <button
                          onClick={() => setPreviewCurrency(null)}
                          className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
                        >
                          Clear Preview
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Order Summary */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
                <span className="text-gray-400">{isMixedCurrency ? "4" : "3"}.</span>
                ORDER SUMMARY
              </h2>

              {/* Conversion notice */}
              {previewCurrency && (
                <div className="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-blue-900 mb-1">
                        Viewing in {previewCurrency}
                      </p>
                      <p className="text-sm text-blue-800">
                        All prices converted using rate: 1 USD = ₹83.50. Original prices shown in gray.
                      </p>
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

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-5 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="relative flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={120}
                          height={120}
                          className="w-28 h-28 object-cover rounded-lg shadow-sm"
                        />
                        {/* Currency badge */}
                        <span className={`absolute -top-2 -left-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 ${
                          originalCurrency === "INR"
                            ? "bg-orange-500 text-white border-orange-600"
                            : "bg-green-500 text-white border-green-600"
                        }`}>
                          {originalCurrency === "INR" ? <RupeeIcon className="w-3 h-3" /> : <DollarIcon className="w-3 h-3" />}
                          {originalCurrency}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {item.category.name} • Qty: {parsedCartItems[index].quantity}
                        </p>
                        
                        {/* Price display */}
                        <div className="space-y-2">
                          {/* Display price (converted or original) */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {displayData.symbol}{Number(unitPrice).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">
                              per item
                            </span>
                          </div>

                          {/* Show conversion details if converted */}
                          {displayData.isConverted && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <p className="text-blue-900 font-medium">
                                    Converted from {originalCurrency}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-blue-800">
                                    <span>
                                      Original: {getCurrencySymbol(originalCurrency)}{Number(originalUnitPrice).toFixed(2)}
                                    </span>
                                    <span className="text-blue-400">→</span>
                                    <span>
                                      Now: {displayData.symbol}{Number(unitPrice).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Total for this item */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-600 font-medium">
                              Subtotal ({parsedCartItems[index].quantity} {parsedCartItems[index].quantity > 1 ? 'items' : 'item'}):
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {displayData.symbol}{Number(displayData.price).toFixed(2)}
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

          {/* ── Right Column ────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4">
              <h2 className="text-gray-700 font-bold text-lg mb-5 border-b pb-3">PRICE DETAILS</h2>

              <div className="space-y-4 mb-5">
                {/* Show breakdown by currency or single total */}
                {singleTotal ? (
                  // Single currency total (when preview is active)
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-blue-800 mb-1">
                        <Eye className="w-3 h-3" />
                        <span className="font-semibold">Viewing in {singleTotal.currency}</span>
                      </div>
                      <p className="text-xs text-blue-700">All items converted to {singleTotal.currency}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Total ({parsedCartItems.reduce((sum, i) => sum + i.quantity, 0)} items)
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {getCurrencySymbol(singleTotal.currency)}{Number(singleTotal.total).toFixed(2)}
                      </span>
                    </div>

                    {/* Show original breakdown */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Original Breakdown:</p>
                      <div className="space-y-1">
                        {Object.entries(totalsByCurrency).map(([currency, total]) => (
                          <div key={currency} className="flex justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              {currency === "INR" ? <RupeeIcon className="w-3 h-3" /> : <DollarIcon className="w-3 h-3" />}
                              {currency}
                            </span>
                            <span>{getCurrencySymbol(currency)}{Number(total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : isMixedCurrency ? (
                  // Multiple currencies breakdown (no preview)
                  <>
                    <div className="space-y-2">
                      {Object.entries(totalsByCurrency).map(([currency, total]) => {
                        const count = itemCurrencies.filter(ic => ic === currency).length;
                        return (
                          <div key={currency} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                {currency === "INR" ? <RupeeIcon className="w-4 h-4" /> : <DollarIcon className="w-4 h-4" />}
                                {currency} Items ({count})
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-gray-500">Subtotal</span>
                              <span className="text-lg font-bold text-gray-900">
                                {getCurrencySymbol(currency)}{Number(total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Use the preview feature above to see prices in a single currency</span>
                      </p>
                    </div>
                  </>
                ) : (
                  // Single currency cart (no conversion needed)
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Price ({parsedCartItems.reduce((sum, i) => sum + i.quantity, 0)} items)
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {getCurrencySymbol(uniqueCurrencies[0])}{Number(Object.values(totalsByCurrency)[0]).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">Delivery Charges</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
              </div>

              {/* Total payable */}
              <div className="pt-4 border-t-2 border-gray-300 mb-5">
                {singleTotal ? (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Payable</span>
                    <span className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol(singleTotal.currency)}{Number(singleTotal.total).toFixed(2)}
                    </span>
                  </div>
                ) : isMixedCurrency ? (
                  <>
                    <p className="font-bold text-gray-900 mb-3">Total Payable</p>
                    <div className="space-y-2">
                      {Object.entries(totalsByCurrency).map(([currency, total]) => (
                        <div key={currency} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                          <span className="flex items-center gap-2 font-semibold text-gray-700">
                            {currency === "INR" ? <RupeeIcon className="w-4 h-4" /> : <DollarIcon className="w-4 h-4" />}
                            {currency}
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            {getCurrencySymbol(currency)}{Number(total).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Payable</span>
                    <span className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol(uniqueCurrencies[0])}{Number(Object.values(totalsByCurrency)[0]).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {!hasBilling && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-medium">
                        Please add your delivery address above to continue.
                      </p>
                    </div>
                  </div>
                )}
                {isEditingBilling && hasBilling && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-medium">
                        Save your address changes to continue.
                      </p>
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
                  By continuing with the order, you confirm that you are above
                  18 years of age, and you agree to the My Thrive Buddy{" "}
                  <Link href="#" className="text-blue-600 hover:underline font-medium">Terms of Use</Link>{" "}
                  and{" "}
                  <Link href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>
                </p>

                <button
                  onClick={() => placeOrderMutation.mutate()}
                  disabled={!canProceed || placeOrderMutation.isPending}
                  className={`w-full py-4 text-white font-bold text-lg rounded-xl transition-all duration-200 ${
                    !canProceed || placeOrderMutation.isPending
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
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Page Export ───────────────────────────────────────────────────────────────

const CheckoutPage = () => (
  <div className="w-full h-full">
    <Suspense fallback={<PageLoader />}>
      <CheckoutContent />
    </Suspense>
  </div>
);

export default CheckoutPage;