"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  IndianRupee,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet,
  Users,
  ArrowUpDown,
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

// ================= TYPES =================

type ApiCreator = {
  creatorId: string;
  creator: {
    name: string;
    email: string;
  };
  currency: string;
  baseAmount: number;
  discountAmount: number;
  netAmount: number;
  commissionAmount: number;
  payableAmount: number;
  holdingAmount: number;
};

type PayoutItem = {
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  baseAmount: number;
  netAmount: number;
  discountAmount: number;
  commissionAmount: number;
  pendingBalance: number;
  currency: string;
  holdingAmount: number;
};

type PaginationData = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
type Analytics = {
  totalPayableINR: number;
  totalPayableUSD: number;
  totalHoldingINR: number;
  totalHoldingUSD: number;
  totalCommission: number;
};
type SortField =
  | "creatorName"
  | "pendingBalance"
  | "baseAmount"
  | "commissionAmount"
  | "discountAmount"
  | "netAmount";
type SortDir = "asc" | "desc";

type DatePreset = "ALL" | "TODAY" | "THIS_MONTH" | "CUSTOM";

// ================= HELPERS =================

function CurrencyIcon({ currency }: { currency: string }) {
  if (currency === "INR")
    return (
      <IndianRupee className="w-3.5 h-3.5 inline-block mr-0.5 opacity-70" />
    );
  return <DollarSign className="w-3.5 h-3.5 inline-block mr-0.5 opacity-70" />;
}

function fmt(amount: number, decimals = 2) {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function SortButton({
  field,
  current,
  dir,
  onClick,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: () => void;
}) {
  const active = current === field;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 ml-1 transition-opacity ${
        active ? "opacity-100" : "opacity-30 hover:opacity-60"
      }`}
    >
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  );
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
  const [sortField, setSortField] = useState<SortField>("pendingBalance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // ✅ Fetch payouts
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "admin-payouts",
      debouncedSearch,
      currencyFilter,
      fromDate,
      toDate,
      page,
      limit,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (currencyFilter !== "ALL") params.append("currency", currencyFilter);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await axios.get(`/api/admin/payouts?${params.toString()}`);

      return {
        creators: res.data.creators.map((c: ApiCreator) => ({
          creatorId: c.creatorId,
          creatorName: c.creator?.name || "Unknown",
          creatorEmail: c.creator?.email || "-",
          baseAmount: Number(c.baseAmount || 0),
          discountAmount: Number(c.discountAmount || 0),
          netAmount: Number(c.netAmount || 0),
          commissionAmount: Number(c.commissionAmount || 0),
          pendingBalance: Number(c.payableAmount || 0),
          holdingAmount: Number(c.holdingAmount || 0),
          currency: c.currency,
        })) as PayoutItem[],
        pagination: res.data.pagination as PaginationData,
        analytics: res.data.analytics,
      };
    },
  });

  const payouts = data?.creators || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };

  // ✅ Process payout
  const processPayoutMutation = useMutation({
    mutationFn: async (payload: {
      creatorId: string;
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

  const filtered = useMemo(() => {
    const list = [...payouts];

    // Server handles search and currency filters, handle client-side sorting here
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      const cmp =
        typeof valA === "string"
          ? valA.localeCompare(valB as string)
          : (valA as number) - (valB as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [payouts, sortField, sortDir]);

  const analyticsRef = useRef<Analytics | null>(null);

  // After the query
  if (data?.analytics) {
    analyticsRef.current = data.analytics;
  }

  const stats = analyticsRef.current ||
    data?.analytics || {
      totalPayableINR: 0,
      totalPayableUSD: 0,
      totalHoldingINR: 0,
      totalHoldingUSD: 0,
      totalCommission: 0,
    };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
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
      creatorId: selectedPayout.creatorId,
      currency: selectedPayout.currency,
      referenceId,
      notes,
      amount: selectedPayout.pendingBalance,
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
            icon={<Users className="w-4 h-4" />}
            label="Total Creators" // Real total matching current filters
            value={pagination.total.toString()}
          />
          <SummaryCard
            icon={<IndianRupee className="w-4 h-4" />}
            label={"Total Pending (INR)"}
            value={`₹${fmt(stats.totalPayableINR)}`}
            highlight
          />
          <SummaryCard
            icon={<DollarSign className="w-4 h-4" />}
            label={"Total Pending (USD)"}
            value={`$${fmt(stats.totalPayableUSD)}`}
            highlight
          />
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" />}
            label={"Total Commission"}
            value={`₹${fmt(stats.totalCommission)}`}
          />
          <SummaryCard
            icon={<IndianRupee className="w-4 h-4" />}
            label="Total Holding (INR)"
            value={`₹${fmt(stats.totalHoldingINR)}`}
          />

          <SummaryCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Total Holding (USD)"
            value={`$${fmt(stats.totalHoldingUSD)}`}
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
                <TableHead>
                  Creator
                  <SortButton
                    field="creatorName"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("creatorName")}
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Base Amount
                  <SortButton
                    field="baseAmount"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("baseAmount")}
                  />
                </TableHead>
                <TableHead className="text-right text-red-500">
                  Discount
                  <SortButton
                    field="discountAmount"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("discountAmount")}
                  />
                </TableHead>
                <TableHead className="text-right font-medium">
                  Net
                  <SortButton
                    field="netAmount"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("netAmount")}
                  />
                </TableHead>

                <TableHead className="text-right text-orange-500">
                  Commission
                  <SortButton
                    field="commissionAmount"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("commissionAmount")}
                  />
                </TableHead>
                <TableHead className="text-right text-green-600">
                  Payable
                  <SortButton
                    field="pendingBalance"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("pendingBalance")}
                  />
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
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
                filtered.map((p) => (
                  <TableRow
                    key={`${p.creatorId}-${p.currency}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Creator */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {p.creatorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.creatorName}</p>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 mt-0.5"
                          >
                            {p.currency}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-muted-foreground text-sm">
                      {p.creatorEmail}
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
                          <span className="cursor-default">
                            − <CurrencyIcon currency={p.currency} />
                            {fmt(p.commissionAmount)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Platform commission deducted
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Payable */}
                    <TableCell className="text-right font-semibold text-green-600">
                      <CurrencyIcon currency={p.currency} />
                      {fmt(p.pendingBalance)}

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
                        href={`/admin/payouts/details/${p.creatorId}?currency=${p.currency}`}
                        target="_blank"
                      >
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleOpenModal(p)}
                        disabled={p.pendingBalance <= 0}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Pay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
                Showing {filtered.length} payout
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
                <span className="font-medium">
                  {selectedPayout?.creatorName}
                </span>
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
                      {fmt(selectedPayout.pendingBalance)}
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
