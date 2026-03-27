"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/common/SkeletonList";
import { columns } from "@/components/transaction-history/columnDef";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TransactionDataTable } from "@/components/transaction-history/data-table";
import { Pagination } from "@/components/ui/pagination";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isSameDay,
} from "date-fns";

import { CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_FILTER = "ALL";

type Balances = {
  GP: number;
  INR: number;
  USD: number;
};
type Totals = {
  earned: { GP: number; INR: number; USD: number };
  spent: { GP: number; INR: number; USD: number };
};

/* ------------------------------------------------ */
/* BALANCE CARDS */
/* ------------------------------------------------ */
const BalanceCardsSkeleton = ({ count }: { count: number }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-6">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-6 w-20 bg-gray-300 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const BalanceCards = ({
  balances,
  totals,
  userType,
}: {
  balances?: Balances;
  totals?: Totals;
  userType?: "COACH" | "ENTHUSIAST";
}) => {
  let items = [];

  if (userType === "COACH") {
    // 6 cards for coach
    items = [
      { label: "GP Balance", value: balances?.GP ?? 0, color: "text-purple-600" },
      { label: "INR Earned", value: totals?.earned?.INR ?? 0, color: "text-emerald-600" },
      { label: "USD Earned", value: totals?.earned?.USD ?? 0, color: "text-green-600" },

      { label: "GP Spent", value: totals?.spent?.GP ?? 0, color: "text-red-600" },
      { label: "INR Spent", value: totals?.spent?.INR ?? 0, color: "text-red-600" },
      { label: "USD Spent", value: totals?.spent?.USD ?? 0, color: "text-red-600" },
    ];
  } else {
    // 4 cards for enthusiast
    items = [
      { label: "GP Balance", value: balances?.GP ?? 0, color: "text-purple-600" },

      { label: "GP Spent", value: totals?.spent?.GP ?? 0, color: "text-red-600" },
      { label: "INR Spent", value: totals?.spent?.INR ?? 0, color: "text-red-600" },
      { label: "USD Spent", value: totals?.spent?.USD ?? 0, color: "text-red-600" },
    ];
  }

  return (
    <div className={`grid gap-4 mb-6 ${userType === "COACH"
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-2 md:grid-cols-4"
      }`}>
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-md sm:text-2xl font-bold ${item.color}`}>
              {item.value.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};



/* ------------------------------------------------ */
/* DATE RANGE FILTER */
/* ------------------------------------------------ */

const DateRangeFilter = ({
  from,
  to,
  setDate,
}: {
  from?: Date;
  to?: Date;
  setDate: (from?: Date, to?: Date) => void;
}) => {

  const today = new Date();

  const presets = {
    today: {
      label: "Today",
      from: today,
      to: today,
    },
    week: {
      label: "This Week",
      from: startOfWeek(today),
      to: today,
    },
    month: {
      label: "This Month",
      from: startOfMonth(today),
      to: today,
    },
    year: {
      label: "This Year",
      from: startOfYear(today),
      to: today,
    },
  };

  const isActive = (pFrom: Date, pTo: Date) =>
    from && to && isSameDay(from, pFrom) && isSameDay(to, pTo);

  const isCustom =
    from &&
    to &&
    !Object.values(presets).some((p) =>
      isActive(p.from, p.to)
    );

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {Object.entries(presets).map(([key, preset]) => {

        const active = isActive(preset.from, preset.to);

        return (
          <Button
            key={key}
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => {
              if (active) {
                // clicking again removes filter
                setDate(undefined, undefined);
              } else {
                setDate(preset.from, preset.to);
              }
            }}
          >
            {preset.label}
          </Button>
        );
      })}

      <Popover>

        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={isCustom ? "default" : "outline"}
            onClick={() => {
              if (isCustom) {
                setDate(undefined, undefined);
              }
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />

            {from ? (
              to
                ? `${format(from, "MMM dd")} - ${format(to, "MMM dd")}`
                : format(from, "MMM dd")
            ) : (
              "Custom"
            )}

          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-4">

          <DayPicker
            mode="range"
            selected={{ from, to }}
            numberOfMonths={2}
            onSelect={(range: DateRange | undefined) =>
              setDate(range?.from, range?.to)
            }
          />

        </PopoverContent>

      </Popover>

    </div>
  );
};



/* ------------------------------------------------ */
/* FILTER SELECTS */
/* ------------------------------------------------ */
const TxTypeSelect = ({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="w-full sm:w-[160px]">
      <SelectValue placeholder="Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">All Types</SelectItem>
      <SelectItem value="CREDIT">Credit</SelectItem>
      <SelectItem value="DEBIT">Debit</SelectItem>
    </SelectContent>
  </Select>
);

const LimitSelect = ({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: string) => void;
}) => (

  <Select value={value.toString()} onValueChange={onValueChange}>
    <SelectTrigger className="w-full sm:w-[160px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="5">5 / page</SelectItem>
      <SelectItem value="10">10 / page</SelectItem>
      <SelectItem value="20">20 / page</SelectItem>
      <SelectItem value="50">50 / page</SelectItem>
    </SelectContent>
  </Select>
);


const CurrencySelect = ({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) => (

  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="w-full sm:w-[140px]">
      <SelectValue placeholder="Currency" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">All Currency</SelectItem>
      <SelectItem value="GP">GP</SelectItem>
      <SelectItem value="INR">INR</SelectItem>
      <SelectItem value="USD">USD</SelectItem>
    </SelectContent>
  </Select>
);



const FilterSelect = ({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) => (

  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="w-full sm:w-[180px]">
      <SelectValue placeholder="Filter" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">All</SelectItem>
      <SelectItem value="CMP">CMP</SelectItem>
      <SelectItem value="CHALLENGE">Challenges</SelectItem>
      <SelectItem value="SUBSCRIPTION">Membership</SelectItem>
      <SelectItem value="STORE_PRODUCT">Store</SelectItem>
      <SelectItem value="MMP">Mini Mastery Programs</SelectItem>
      {/* <SelectItem value="GP">GP</SelectItem> */}
    </SelectContent>
  </Select>
);



/* ------------------------------------------------ */
/* MAIN CONTENT */
/* ------------------------------------------------ */

const TransactionHistoryContent = () => {

  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || DEFAULT_PAGE;
  const limit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
  const filter = searchParams.get("filter") || DEFAULT_FILTER;
  const currency = searchParams.get("currency") || "ALL";
  const txType = searchParams.get("txType") || "ALL";

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const { data: session } = useSession();

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined) params.delete(k);
      else params.set(k, String(v));
    });

    // reset page ONLY if page is not being updated
    if (!("page" in updates)) {
      params.set("page", "1");
    }

    router.push(`/dashboard/transactions-history?${params.toString()}`);
  };

  const { data, isLoading } = useQuery({

    queryKey: ["transactions-history", page, limit, filter, currency, from, to, txType],

    queryFn: async () => {

      const { data } = await axios.get(
        `/api/user/history?page=${page}&limit=${limit}&filter=${filter}&currency=${currency}&from=${from ?? ""}&to=${to ?? ""}&txType=${txType}&version=v3`
      );

      return data;
    },

    placeholderData: (prev) => prev,
  });

  const setDate = (from?: Date, to?: Date) => {

    updateParams({
      from: from ? format(from, "yyyy-MM-dd") : undefined,
      to: to ? format(to, "yyyy-MM-dd") : undefined,
    });
  };

  const { transactions = [], totalPages, balances, totals } = data || {};
  const userType =
    session?.user?.userType === "COACH" ||
      session?.user?.userType === "ENTHUSIAST"
      ? session.user.userType
      : undefined;

  if (isLoading) {
    const skeletonCount =
      session?.user?.userType === "COACH" ? 6 : 4;
    return (
      <>
        <BalanceCardsSkeleton count={skeletonCount} />

        <Card>
          <CardContent className="p-6">
            <SkeletonList count={5} />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>


      <BalanceCards
        balances={balances}
        totals={totals}
        userType={userType}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">

        <FilterSelect
          value={filter}
          onValueChange={(v) => updateParams({ filter: v })}
        />

        <CurrencySelect
          value={currency}
          onValueChange={(v) => updateParams({ currency: v })}
        />
        <TxTypeSelect
          value={txType}
          onValueChange={(v) => updateParams({ txType: v })}
        />

        <DateRangeFilter
          from={from ? new Date(from) : undefined}
          to={to ? new Date(to) : undefined}
          setDate={setDate}
        />

        <LimitSelect
          value={limit}
          onValueChange={(v) => updateParams({ limit: v })}
        />

      </div>

      <Card>
        <CardContent className="p-0">

          <TransactionDataTable
            columns={columns}
            data={transactions}
            currentPage={page}
            totalPages={totalPages}
            isLoading={false}
            onPageChange={(p) => updateParams({ page: p })}
          />

          <div className="p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParams({ page: p })}
            />
          </div>

        </CardContent>
      </Card>
    </>
  );
};



/* ------------------------------------------------ */
/* PAGE WRAPPER */
/* ------------------------------------------------ */

const TransactionsHistoryPage = () => {

  return (
    <div className="p-6">

      <Suspense
        fallback={
          <Card className="p-6">
            <SkeletonList count={5} />
          </Card>
        }
      >
        <TransactionHistoryContent />
      </Suspense>

    </div>
  );
};

export default TransactionsHistoryPage;