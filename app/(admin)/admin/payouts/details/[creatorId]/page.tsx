"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  IndianRupee,
  DollarSign,
  Package,
  User,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ================= TYPES =================
type EarningDetail = {
  id: string;
  paymentOrderId: string;
  contextId: string;
  contextType: string;
  baseAmount: number;
  platformFee: number; // Commission
  earnedAmount: number; // Final creator earning
  currency: string;
  status: "PENDING" | "PAID";
  createdAt: string;
  isHolding: boolean;
  isMatured: boolean;
  buyerName: string;
  buyerEmail: string;
  itemName: string;
  discountApplied: number; //  Added Discount
  netAmount: number;
};

type PayoutApiResponse = {
  creator: {
    name: string;
    email: string;
  };
  earnings: EarningDetail[];
  analytics: {
    total: number;
    paid: number;
    matured: number;
    holding: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
};
// ================= HELPERS =================
function CurrencyIcon({ currency }: { currency: string }) {
  return currency === "INR" ? (
    <IndianRupee className="w-3.5 h-3.5 inline-block mr-0.5 opacity-70" />
  ) : (
    <DollarSign className="w-3.5 h-3.5 inline-block mr-0.5 opacity-70" />
  );
}

function fmt(amount: number, decimals = 2) {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatContextType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ================= COMPONENT =================
export default function CreatorPayoutDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.creatorId as string;
  const type = searchParams.get("type"); // CREATOR | AFFILIATE
  const currency = searchParams.get("currency");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  //  Updated useQuery to handle the new { creator, earnings } response
  const { data, isLoading, isError } = useQuery<PayoutApiResponse>({
    queryKey: [
      "creator-payout-details",
      id,
      page,
      limit,
      statusFilter,
      currency,
      fromDate,
      toDate,
    ],

    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("type", type ?? "");
      queryParams.set("page", String(page));
      queryParams.set("limit", String(limit));
      queryParams.set("status", statusFilter);
      if (currency && currency !== "ALL") queryParams.set("currency", currency);
      if (fromDate) queryParams.set("fromDate", fromDate);
      if (toDate) queryParams.set("toDate", toDate);

      const res = await axios.get(
        `/api/admin/payouts/${id}?${queryParams.toString()}`,
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const [datePreset, setDatePreset] = useState<
    "ALL" | "TODAY" | "THIS_MONTH" | "CUSTOM"
  >("ALL");

  const totalPages = data?.pagination?.totalPages || 1;

  //  Safely extract derived data
  const earnings = data?.earnings || [];
  const creator = data?.creator || { name: "", email: "" };

  const filteredEarnings = earnings;

  // Calculate stats
  const stats = data?.analytics || {
    total: 0,
    paid: 0,
    matured: 0,
    holding: 0,
  };
  const handleDatePresetChange = (val: string) => {
    setDatePreset(val as typeof datePreset);

    const today = new Date();

    if (val === "ALL") {
      setFromDate("");
      setToDate("");
    } else if (val === "TODAY") {
      const d = today.toISOString().split("T")[0];
      setFromDate(d);
      setToDate(d);
    } else if (val === "THIS_MONTH") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(first.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    }
  };
  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setLimit(10);
    setFromDate("");
    setToDate("");
    setDatePreset("ALL");
    setPage(1); // ✅ important

    const params = new URLSearchParams(searchParams.toString());
    params.delete("currency");

    router.push(`?${params.toString()}`);
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/admin/payouts`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger Details</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <User className="w-4 h-4" />
            {creator.name} {creator.email && `(${creator.email})`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready to Pay (Matured)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {fmt(stats.matured)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Holding Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {fmt(stats.holding)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Historically Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="w-5 h-5 mr-1" />
              {fmt(stats.paid)}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="MATURED">Matured</SelectItem>
              <SelectItem value="HOLDING">Holding</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Currency */}
          <Select
            value={currency || "ALL"}
            onValueChange={(v) => {
              setPage(1);
              const params = new URLSearchParams(searchParams.toString());
              if (v === "ALL") params.delete("currency");
              else params.set("currency", v);
              router.push(`?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Currencies</SelectItem>
              <SelectItem value="INR">INR only</SelectItem>
              <SelectItem value="USD">USD only</SelectItem>
            </SelectContent>
          </Select>

          {/* Per Page */}
          <Select
            value={limit.toString()}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Preset */}
          <Select value={datePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Time</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="THIS_MONTH">This Month</SelectItem>
              <SelectItem value="CUSTOM">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date */}
          {datePreset === "CUSTOM" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </>
          )}

          {/* Clear Filters */}
          {(statusFilter !== "ALL" || currency || fromDate || toDate) && (
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground px-2"
              onClick={handleClearFilters}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
      {/* Data Section */}
      <div className="border rounded-lg bg-card overflow-hidden flex flex-col space-y-4 p-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Purchased Item</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="text-center">
                {/* Base Amount */}
                Total Business Referred
              </TableHead>
              <TableHead className="text-center text-red-500">
                Discount
              </TableHead>
              <TableHead className="text-center">
                Net Business Referred
              </TableHead>
              {type !== "AFFILIATE" && (
                <TableHead className="text-center text-orange-500">
                  MTB Commission
                </TableHead>
              )}
              <TableHead className="text-center font-bold text-green-600">
                Final Earning
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="whitespace-nowrap">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="animate-spin mx-auto w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading details…
                  </p>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-red-500"
                >
                  Failed to load transaction details.
                </TableCell>
              </TableRow>
            ) : filteredEarnings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  No transactions found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredEarnings.map((e) => (
                <TableRow
                  key={e.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* Date & ID */}
                  <TableCell>
                    <div className="font-medium text-sm">
                      {format(new Date(e.createdAt), "dd MMM yyyy, p")}
                    </div>
                  </TableCell>

                  {/* Item Details */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p
                          className="font-medium text-sm line-clamp-1"
                          title={e.itemName}
                        >
                          {e.itemName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatContextType(e.contextType)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Buyer Details */}
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{e.buyerName}</p>
                      {e.buyerEmail !== "N/A" && (
                        <p className="text-xs text-muted-foreground">
                          {e.buyerEmail}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Base Amount */}
                  <TableCell className="text-center text-sm">
                    <CurrencyIcon currency={e.currency} />
                    {fmt(e.baseAmount)}
                  </TableCell>

                  {/* ✅ Discount */}
                  <TableCell className="text-center text-sm text-red-500 ">
                    {e.discountApplied > 0 ? (
                      <>
                        − <CurrencyIcon currency={e.currency} />
                        {fmt(e.discountApplied)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {/* Net Amount */}
                  <TableCell className="text-center text-sm">
                    <CurrencyIcon currency={e.currency} />
                    {fmt(e.netAmount)}
                  </TableCell>
                  {/* Commission */}
                  {type !== "AFFILIATE" && (
                    <TableCell className="text-center text-sm text-orange-500">
                      {e.platformFee > 0 ? (
                        <>
                          − <CurrencyIcon currency={e.currency} />
                          {fmt(e.platformFee)}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}

                  {/* Final Earning */}
                  <TableCell className="text-center font-semibold text-green-600">
                    <CurrencyIcon currency={e.currency} />
                    {fmt(e.earnedAmount)}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="text-center">
                    {e.status === "PAID" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Paid
                      </Badge>
                    ) : e.isMatured ? (
                      <Badge
                        variant="default"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none shadow-none"
                      >
                        Matured
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Holding
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col items-center justify-center py-4 border-t bg-muted/10 gap-2">
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          )}

          <p className="text-xs text-muted-foreground">
            Showing {earnings.length} entries (Total:{" "}
            {data?.pagination?.totalCount || 0})
          </p>
        </div>
      </div>
    </div>
  );
}
