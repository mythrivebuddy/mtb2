"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  IndianRupee,
  DollarSign,
  Search,
  TrendingUp,
  Wallet,
  Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { useServerSort } from "@/hooks/use-server-sort";
import SortIndicator from "@/components/common/SortIndicator";
import Image from "next/image";
import { getInitials } from "@/utils/getInitials";

// ================= TYPES =================

type AnalyticsResponse = {
  creator: {
    totalPayable: number;
    totalHolding: number;
    totalCommission: number;
  };
  affiliate: {
    totalPayable: number;
    totalHolding: number;
  };
};
type ApiResponse = {
  payouts: PayoutItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  analytics: AnalyticsResponse;
};

type PayoutItem = {
  id: string;
  name: string;
  email: string;
  image?: string;

  type: "CREATOR" | "AFFILIATE";
  creatorId?: string; // Added
  affiliateId?: string; // Added
  creator?: { name: string; email: string; image: string | null };
  affiliate?: { name: string; email: string; image: string | null };

  baseAmount: number;
  discountAmount: number;
  netAmount: number;
  commissionAmount: number;

  payableAmount: number;
  holdingAmount: number;
  currency: string;
};

type DatePreset = "ALL" | "TODAY" | "THIS_MONTH" | "CUSTOM";

// ================= HELPERS =================

function CurrencyIcon({ currency }: { currency: string }) {
  if (currency === "INR")
    return (
      <IndianRupee className="w-3.5 h-3.5 inline-block mr-0.5 opacity-70" />
    );
  return <DollarSign className="w-3.5 h-3.5 inline-block mr-0.5 opacity-70" />;
}

function fmt(amount: number | undefined | null, decimals = 2) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0.00";
  }

  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ================= COMPONENT =================

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "INR" | "USD">(
    "ALL",
  );

  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, currencyFilter, fromDate, toDate, limit]);

  // Sort state
  const { sortBy, sortOrder, handleSort } = useServerSort("payableAmount");
  // ✅ Fetch payouts
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: [
      "admin-payouts",
      debouncedSearch,
      currencyFilter,
      fromDate,
      toDate,
      page,
      limit,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (currencyFilter !== "ALL") params.append("currency", currencyFilter);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await axios.get(`/api/admin/payouts?${params.toString()}`);

      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const payouts = data?.payouts || [];

  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };

  // ✅ Process payout
  const processPayoutMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      type: "CREATOR" | "AFFILIATE";
      currency: string;
      referenceId: string;
      notes: string;
      amount: number;
    }) => axios.post("/api/admin/payouts/mark-paid", payload),
    onSuccess: () => {
      toast.success("Payout completed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      closeModal();
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error) || "Failed to process payout");
    },
  });

  // ================= DERIVED DATA =================
  const filtered = payouts;
  const rows = payouts;
  const handleSortWithReset = (field: string) => {
    setPage(1);
    handleSort(field);
  };

  const analyticsRef = useRef<AnalyticsResponse | null>(null);

  // After the query
  if (data?.analytics) {
    analyticsRef.current = data.analytics;
  }

  const analytics = data?.analytics;

  const stats = {
    totalPayable:
      (analytics?.creator?.totalPayable || 0) +
      (analytics?.affiliate?.totalPayable || 0),

    totalHolding:
      (analytics?.creator?.totalHolding || 0) +
      (analytics?.affiliate?.totalHolding || 0),

    totalCommission: analytics?.creator?.totalCommission || 0,

    creatorPayable: analytics?.creator?.totalPayable || 0,
    affiliatePayable: analytics?.affiliate?.totalPayable || 0,

    creatorHolding: analytics?.creator?.totalHolding || 0,
    affiliateHolding: analytics?.affiliate?.totalHolding || 0,
  };

  const handleOpenModal = (payout: PayoutItem) => {
    setSelectedPayout(payout);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayout(null);
    setReferenceId("");
    setNotes("");
  };

  // ✅ Handle Date Preset Changes
  const handleDatePresetChange = (val: string) => {
    const preset = val as DatePreset;
    setDatePreset(preset);

    const today = new Date();

    if (preset === "ALL") {
      setFromDate("");
      setToDate("");
    } else if (preset === "TODAY") {
      const dateString = today.toISOString().split("T")[0];
      setFromDate(dateString);
      setToDate(dateString);
    } else if (preset === "THIS_MONTH") {
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      setFromDate(firstDayOfMonth.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    } else if (preset === "CUSTOM") {
      // Keep existing dates or reset if empty
      setFromDate((prev) => prev);
      setToDate((prev) => prev);
    }
  };

  // ✅ Clear Filters logic
  const handleClearFilters = () => {
    setSearch("");
    setCurrencyFilter("ALL");
    setDatePreset("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleConfirmPayout = () => {
    if (!selectedPayout) return;
    processPayoutMutation.mutate({
      userId: selectedPayout.id,
      type: selectedPayout.type,
      currency: selectedPayout.currency,
      referenceId,
      notes,
      amount: selectedPayout.payableAmount,
    });
  };

  // Check if any standard filters are active (ignoring pagination)
  const hasActiveFilters = Boolean(
    search ||
      currencyFilter !== "ALL" ||
      datePreset !== "ALL" ||
      fromDate ||
      toDate,
  );

  // ================= RENDER =================

  return (
    <TooltipProvider>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Creator Payouts
            </h1>
            <p className="text-muted-foreground mt-1">
              Review earnings breakdown and process pending payouts
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Wallet className="w-4 h-4" />}
            label="Total Payable"
            value={`₹${fmt(stats.totalPayable)}`}
            highlight
          />

          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Total Holding"
            value={`₹${fmt(stats.totalHolding)}`}
          />

          <SummaryCard
            icon={<Users className="w-4 h-4" />}
            label="Creator Payable"
            value={`₹${fmt(stats.creatorPayable)}`}
          />

          <SummaryCard
            icon={<Users className="w-4 h-4" />}
            label="Affiliate Payable"
            value={`₹${fmt(stats.affiliatePayable)}`}
          />

          <SummaryCard
            icon={<IndianRupee className="w-4 h-4" />}
            label="Platform Commission"
            value={`₹${fmt(stats.totalCommission)}`}
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Currency filter */}
            <Select
              value={currencyFilter}
              onValueChange={(v) =>
                setCurrencyFilter(v as "ALL" | "INR" | "USD")
              }
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

            {/* ✅ Items Per Page Filter */}
            <Select
              value={limit.toString()}
              onValueChange={(v) => setLimit(Number(v))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>

            {/* ✅ Date Range Filter */}
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

            {/* Custom Date Inputs (Only visible if 'Custom Range' is selected) */}
            {datePreset === "CUSTOM" && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground text-sm">From</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground text-sm">To</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </>
            )}

            {/* ✅ Clear Filter Button */}
            {hasActiveFilters && (
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

        {/* Table Container */}
        <div className="border rounded-lg bg-card overflow-hidden flex flex-col">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  onClick={() => handleSortWithReset("name")}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center gap-1">
                    Creator
                    <SortIndicator
                      field="name"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                    />
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead
                  onClick={() => handleSortWithReset("baseAmount")}
                  className="cursor-pointer group text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    Base Amount
                    <SortIndicator
                      field="baseAmount"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                    />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSortWithReset("discountAmount")}
                  className="cursor-pointer group text-right text-red-500"
                >
                  <div className="flex items-center justify-end gap-1">
                    Discount
                    <SortIndicator
                      field="discountAmount"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                    />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSortWithReset("netAmount")}
                  className="cursor-pointer group text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Net
                    <SortIndicator
                      field="netAmount"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                    />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSortWithReset("commissionAmount")}
                  className="cursor-pointer group text-right text-orange-500"
                >
                  <div className="flex items-center justify-end gap-1">
                    Commission
                    <SortIndicator
                      field="commissionAmount"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                    />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSortWithReset("payableAmount")}
                  className="cursor-pointer group text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Payable
                    <SortIndicator
                      field="payableAmount"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="animate-spin mx-auto w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading payouts…
                    </p>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-red-500"
                  >
                    Failed to load payouts. Please try again.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No pending payouts.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const isCreator = p.type === "CREATOR";
                  const rowUniqueId = isCreator ? p.creatorId : p.affiliateId;
                  const userData =
                    p.type === "CREATOR" ? p.creator : p.affiliate;

                  // 2. Get the values safely
                  const displayName = userData?.name || "Unknown";
                  const displayImage = userData?.image;

                  return (
                    <TableRow
                      key={`${rowUniqueId}-${p.currency}-${p.type}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Creator */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {displayImage ? (
                            <Image
                              height={300}
                              width={300}
                              className="h-8 w-8 object-cover rounded-full"
                              src={displayImage}
                              alt={displayName}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {getInitials(displayName)}
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-sm">{displayName}</p>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 mt-0.5"
                            >
                              {p.currency}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.type === "CREATOR" ? "default" : "secondary"
                          }
                        >
                          {p.type}
                        </Badge>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-muted-foreground text-sm">
                        {userData?.email}
                      </TableCell>

                      {/* Base Amount */}
                      <TableCell className="text-right text-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              <CurrencyIcon currency={p.currency} />
                              {fmt(p.baseAmount)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Gross earnings before any deductions
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      {/* ✅ Discount Amount */}
                      <TableCell className="text-right text-sm text-red-500 whitespace-nowrap">
                        <span className="cursor-default">
                          {p.discountAmount > 0 ? "-" : ""}{" "}
                          <CurrencyIcon currency={p.currency} />
                          {fmt(p.discountAmount)}
                        </span>
                      </TableCell>

                      {/* ✅ Net Amount */}
                      <TableCell className="text-right text-sm font-medium whitespace-nowrap">
                        <span className="cursor-default">
                          <CurrencyIcon currency={p.currency} />
                          {fmt(p.netAmount)}
                        </span>
                      </TableCell>
                      {/* Commission */}
                      <TableCell className="text-right text-sm text-orange-500">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {p.type === "CREATOR" ? (
                              <span>
                                − <CurrencyIcon currency={p.currency} />
                                {fmt(p.commissionAmount)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            Platform commission deducted
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Payable */}
                      <TableCell className="text-right font-semibold text-green-600">
                        <CurrencyIcon currency={p.currency} />
                        {fmt(p.payableAmount)}

                        {p.holdingAmount > 0 && (
                          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-1 w-fit ml-auto">
                            🕐 <CurrencyIcon currency={p.currency} />
                            {fmt(p.holdingAmount)} in holding
                          </div>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right space-x-2">
                        <Link
                          href={`/admin/payouts/details/${p.id}&type=${p.type}?currency=${p.currency}`}
                          target="_blank"
                        >
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleOpenModal(p)}
                          disabled={p.payableAmount <= 0}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* ✅ Centered Pagination placed INSIDE the Table container border */}
          {filtered.length > 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-4 border-t border-muted/50 bg-muted/10 gap-2">
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Showing {rows.length} payout
                {filtered.length !== 1 ? "s" : ""} on this page (Total:{" "}
                {pagination.total})
              </p>
            </div>
          )}
        </div>

        {/* ===== PAYOUT MODAL ===== */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Confirm Payout
              </DialogTitle>
              <DialogDescription>
                Paying{" "}
                <span className="font-medium">{selectedPayout?.name}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedPayout && (
              <div className="space-y-4">
                {/* Breakdown */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Amount</span>
                    <span>
                      <CurrencyIcon currency={selectedPayout.currency} />
                      {fmt(selectedPayout.baseAmount)}
                    </span>
                  </div>
                  {selectedPayout.discountAmount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>− Discount</span>
                      <span>
                        <CurrencyIcon currency={selectedPayout.currency} />
                        {fmt(selectedPayout.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Net Amount</span>
                    <span>
                      <CurrencyIcon currency={selectedPayout.currency} />
                      {fmt(selectedPayout.netAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-orange-500">
                    <span>− Commission</span>
                    <span>
                      <CurrencyIcon currency={selectedPayout.currency} />
                      {fmt(selectedPayout.commissionAmount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-green-600 text-base">
                    <span>Payable Amount</span>
                    <span className="flex items-center">
                      <CurrencyIcon currency={selectedPayout.currency} />
                      {fmt(selectedPayout.payableAmount)}
                    </span>
                  </div>
                </div>

                {/* Reference ID */}
                <div className="space-y-1.5">
                  <Label>Reference ID</Label>
                  <Input
                    placeholder="e.g. TXN123456"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Any remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayout}
                disabled={
                  processPayoutMutation.isPending || !referenceId.trim()
                }
              >
                {processPayoutMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirm Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ================= SUMMARY CARD =================

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <p
        className={`text-xl font-bold tracking-tight ${
          highlight ? "text-green-600" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
