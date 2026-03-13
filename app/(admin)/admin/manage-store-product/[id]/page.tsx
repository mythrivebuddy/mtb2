"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PageSkeleton from "@/components/PageSkeleton";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Tag,
  Calendar,
  Download,
  User,
  ShieldCheck,
  Package,
  Clock,
  Hash,
  Layers,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductDetailData {
  id: string;
  name: string;
  basePrice: number;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  lifetimePrice: number | null;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string | null;
  approvedAt: string | null;
  isApproved: boolean;
  createdByRole: string;
  currency?: string;
  category: {
    id: string;
    name: string;
  };
  createdByUserId: string;
  categoryId: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  approvedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchProduct(productId: string): Promise<ProductDetailData> {
  const res = await fetch(`/api/admin/store/items/${productId}`);
  if (!res.ok) throw new Error("Failed to fetch product details");
  const data = await res.json();
  return data.product;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GP: "GP",
  JP: "JP",
};

function getCurrencySymbol(currency?: string): string {
  return CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";
}

function formatPrice(price: number | null, currency?: string): string {
  if (price === null || price === undefined) return "—";
  const isPoints = currency === "GP" || currency === "JP";
  return `${getCurrencySymbol(currency)}${isPoints ? Math.ceil(price) : price.toFixed(2)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const RupeeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const GPIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const JPIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M15 9h-3.5a2.5 2.5 0 1 0 0 5h2a2.5 2.5 0 1 1 0 5H9" />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className={`mt-0.5 ${accent ?? "text-blue-500"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-gray-800 break-words">{value}</div>
      </div>
    </div>
  );
}

function PriceCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 flex flex-col items-center justify-center text-center border transition-all duration-200 hover:shadow-md ${
        highlight
          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-100"
          : "bg-white text-gray-800 border-gray-200"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
          highlight ? "text-blue-100" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <p className={`text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <PageSkeleton type="approve" />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100">
          <h2 className="text-3xl font-bold text-rose-600 mb-4 text-center">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            {(error as Error)?.message ?? "This product could not be loaded."}
          </p>
          <Button
            onClick={() => router.back()}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currency = product.currency ?? "INR";
  const isINR = currency === "INR";
  const isUSD = currency === "USD";
  const isGP = currency === "GP";
  const isJP = currency === "JP";
  const currencySym = getCurrencySymbol(currency);

  // Helper to get currency icon
  const CurrencyIcon = isINR 
    ? RupeeIcon 
    : isUSD 
    ? DollarIcon 
    : isGP
    ? GPIcon
    : isJP
    ? JPIcon
    : RupeeIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-12 px-4">
      <div className="max-w-5xl mx-auto pt-4">

        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Products</span>
          </Button>
        </div>

        <Card className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-gray-100">

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-36 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {/* Status badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Currency badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm border ${
                  isINR
                    ? "bg-orange-400/20 text-orange-100 border-orange-300/40"
                    : isUSD
                    ? "bg-green-400/20 text-green-100 border-green-300/40"
                    : "bg-purple-400/20 text-purple-100 border-purple-300/40"
                }`}
              >
                <CurrencyIcon className="w-3.5 h-3.5" />
                {currency}
              </span>
              {/* Approval badge */}
              {product.isApproved ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-400/20 text-green-100 border border-green-300/40 backdrop-blur-sm">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approved
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-400/20 text-red-100 border border-red-300/40 backdrop-blur-sm">
                  <XCircle className="w-3.5 h-3.5" />
                  Pending Approval
                </span>
              )}
            </div>
          </div>

          <div className="relative px-6 md:px-8">
            {/* Product Image */}
            <div className="absolute -top-16 left-6 md:left-8">
              <div className="h-32 w-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100 transform hover:scale-105 transition-transform duration-300">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/128x128?text=No+Image";
                  }}
                />
              </div>
            </div>

            {/* Header */}
            <CardHeader className="pt-20 pb-4 px-0">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                      {product.name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      <Layers className="w-3 h-3" />
                      {product.category.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                      <User className="w-3 h-3" />
                      {product.createdByRole}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {product.downloadUrl && (
                    <a href={product.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-5">
                        <Download className="h-4 w-4" />
                        Download File
                      </Button>
                    </a>
                  )}
                  <a href={product.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-white/70 hover:bg-white border-gray-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Image
                    </Button>
                  </a>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-8 space-y-8">

              {/* Pricing Cards */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CurrencyIcon className="w-4 h-4" />
                  Pricing ({currency})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PriceCard label="Base"     value={formatPrice(product.basePrice,     currency)} highlight />
                  <PriceCard label="Monthly"  value={formatPrice(product.monthlyPrice,  currency)} />
                  <PriceCard label="Yearly"   value={formatPrice(product.yearlyPrice,   currency)} />
                  <PriceCard label="Lifetime" value={formatPrice(product.lifetimePrice, currency)} />
                </div>
              </div>

              {/* Two-column detail cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Product Info */}
                <Card className="bg-white/60 backdrop-blur-md shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-0 pt-5 px-5">
                    <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Product Details
                    </h3>
                  </CardHeader>
                  <CardContent className="px-5 pt-2 pb-4">
                    <InfoRow
                      icon={<Hash className="w-4 h-4" />}
                      label="Product ID"
                      value={
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 break-all">
                          {product.id}
                        </span>
                      }
                    />
                    <InfoRow
                      icon={<Tag className="w-4 h-4" />}
                      label="Category"
                      value={product.category.name}
                    />
                    <InfoRow
                      icon={<CurrencyIcon className="w-4 h-4" />}
                      label="Currency"
                      value={
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                            isINR
                              ? "bg-orange-100 text-orange-700"
                              : isUSD
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {currencySym} {currency}
                        </span>
                      }
                    />
                    <InfoRow
                      icon={<Calendar className="w-4 h-4" />}
                      label="Created At"
                      value={formatDate(product.createdAt)}
                    />
                    <InfoRow
                      icon={<RefreshCw className="w-4 h-4" />}
                      label="Last Updated"
                      value={formatDate(product.updatedAt)}
                    />
                    <InfoRow
                      icon={<Download className="w-4 h-4" />}
                      label="Download File"
                      value={
                        product.downloadUrl ? (
                          <a
                            href={product.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Available <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )
                      }
                    />
                  </CardContent>
                </Card>

                {/* Approval & Creator Info */}
                <Card className="bg-white/60 backdrop-blur-md shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-0 pt-5 px-5">
                    <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                      Approval & Creator
                    </h3>
                  </CardHeader>
                  <CardContent className="px-5 pt-2 pb-4">
                    <InfoRow
                      icon={
                        product.isApproved ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )
                      }
                      label="Approval Status"
                      value={
                        product.isApproved ? (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                            Pending
                          </Badge>
                        )
                      }
                    />
                    <InfoRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Approved At"
                      value={
                        product.approvedAt ? (
                          formatDate(product.approvedAt)
                        ) : (
                          <span className="text-gray-400">Not yet approved</span>
                        )
                      }
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Approved By"
                      value={
                        product.approvedBy ? (
                          <span>{product.approvedBy.name ?? product.approvedBy.email}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      }
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4 text-indigo-400" />}
                      label="Created By"
                      value={
                        <div>
                          <p className="font-medium">
                            {product.creator.name ?? product.creator.email}
                          </p>
                          <p className="text-xs text-gray-400">{product.creator.email}</p>
                        </div>
                      }
                      accent="text-indigo-400"
                    />
                    <InfoRow
                      icon={<Tag className="w-4 h-4 text-purple-400" />}
                      label="Created By Role"
                      value={
                        <Badge className="bg-purple-100 text-purple-700 border-0 text-xs capitalize">
                          {product.createdByRole}
                        </Badge>
                      }
                      accent="text-purple-400"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Category ID */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Category ID</p>
                  <p className="font-mono text-xs text-gray-600 mt-0.5">{product.category.id}</p>
                </div>
              </div>

            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}