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
} from "lucide-react";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Item } from "@/types/client/store";
import Image from "next/image";
import { useSession } from "next-auth/react";

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

  // ✅ Session for prefilling name and email
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
        const res = await axios.get(
          `/api/user/store/items/get-item?itemId=${itemId}`
        );
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

  // ✅ Default billing prefilled from session when no saved billing exists
  const defaultBilling: BillingInfo = {
    ...EMPTY_BILLING,
    fullName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  };

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

  // Place order mutation — sends all cart items at once
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/user/store/items/place-order", {
        items: parsedCartItems.map(({ itemId, quantity }) => ({
          itemId,
          quantity,
        })),
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

  const totalAmount = items.reduce((total, item, index) => {
    return total + item.basePrice * parsedCartItems[index].quantity;
  }, 0);

  const canProceed = hasBilling && !isEditingBilling;

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
                {/* ✅ Use savedBilling when editing, else prefill from session */}
                <BillingForm
                  billing={isEditingBilling && savedBilling ? savedBilling : defaultBilling}
                  onSave={(data) => saveBillingMutation.mutate(data)}
                  isSaving={saveBillingMutation.isPending}
                  showCancel={isEditingBilling && hasBilling}
                  onCancel={() => setIsEditingBilling(false)}
                />
              </div>
            ) : (
              <BillingSummary
                billing={savedBilling!}
                onEdit={() => setIsEditingBilling(true)}
              />
            )}

            {/* 3. Order Summary */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-4">3. ORDER SUMMARY</h2>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b pb-4 last:border-b-0"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Pack of 1, {item.category.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold">
                          ${item.basePrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Qty: {parsedCartItems[index].quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column ────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow sticky top-4">
              <h2 className="text-gray-500 font-medium mb-4">PRICE DETAILS</h2>
              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between">
                  <span>
                    Price (
                    {parsedCartItems.reduce((sum, i) => sum + i.quantity, 0)}{" "}
                    items)
                  </span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="text-green-600">FREE</span>
                </div>
              </div>
              <div className="flex justify-between font-bold py-4">
                <span>Total Payable</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <div className="mt-6 space-y-4">
                {!hasBilling && (
                  <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2">
                    Please add your delivery address above to continue.
                  </p>
                )}
                {isEditingBilling && hasBilling && (
                  <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2">
                    Save your address changes to continue.
                  </p>
                )}

                <div className="flex items-start gap-2 text-gray-600 text-sm">
                  <Shield className="w-5 h-5 flex-shrink-0 text-gray-400" />
                  <p>
                    Safe and Secure Payments. Easy returns. 100% Authentic
                    products.
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  By continuing with the order, you confirm that you are above
                  18 years of age, and you agree to the My Thrive Buddy{" "}
                  <Link href="#" className="text-blue-600">
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-blue-600">
                    Privacy Policy
                  </Link>
                </p>

                <button
                  onClick={() => placeOrderMutation.mutate()}
                  disabled={!canProceed || placeOrderMutation.isPending}
                  className={`w-full py-4 text-white font-bold rounded-lg transition-colors ${
                    !canProceed || placeOrderMutation.isPending
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#fb641b] hover:bg-[#fb641b]/90"
                  }`}
                >
                  {placeOrderMutation.isPending
                    ? "Placing Order..."
                    : "Place Order"}
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