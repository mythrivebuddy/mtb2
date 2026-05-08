"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
};

type PayoutApiResponse = {
  creator: {
    name: string;
    email: string;
  };
  earnings: EarningDetail[];
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
  const router = useRouter();
  const creatorId = params.creatorId as string;

  const [filter, setFilter] = useState<"ALL" | "MATURED" | "HOLDING" | "PAID">(
    "ALL",
  );

  //  Updated useQuery to handle the new { creator, earnings } response
  const { data, isLoading, isError } = useQuery<PayoutApiResponse>({
    queryKey: ["creator-payout-details", creatorId],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/payouts/${creatorId}`);
      return res.data;
    },
  });

  //  Safely extract derived data
  const earnings = data?.earnings || [];
  const creator = data?.creator || { name: "Unknown Creator", email: "" };

  const filteredEarnings = earnings.filter((e) => {
    if (filter === "MATURED") return e.isMatured;
    if (filter === "HOLDING") return e.isHolding;
    if (filter === "PAID") return e.status === "PAID";
    return true; // ALL
  });

  // Calculate stats
  const stats = earnings.reduce(
    (acc, curr) => {
      if (curr.status === "PAID") acc.paid += curr.earnedAmount;
      else if (curr.isMatured) acc.matured += curr.earnedAmount;
      else if (curr.isHolding) acc.holding += curr.earnedAmount;
      return acc;
    },
    { paid: 0, matured: 0, holding: 0 },
  );

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

      {/* Data Section */}
      <div className="border rounded-lg bg-card overflow-hidden flex flex-col space-y-4 p-4">
        <div className="flex justify-between items-center">
          <Tabs
            value={filter}
            onValueChange={(v) =>
              setFilter(v as "ALL" | "MATURED" | "HOLDING" | "PAID")
            }
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="ALL">All Transactions</TabsTrigger>
              <TabsTrigger value="MATURED">Matured</TabsTrigger>
              <TabsTrigger value="HOLDING">Holding</TabsTrigger>
              <TabsTrigger value="PAID">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Purchased Item</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="text-right">Base Amount</TableHead>
              <TableHead className="text-right text-red-500">
                Discount
              </TableHead>
              <TableHead className="text-right text-orange-500">
                Platform Fee
              </TableHead>
              <TableHead className="text-right font-bold text-green-600">
                Final Earning
              </TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                  <TableCell className="text-right text-sm">
                    <CurrencyIcon currency={e.currency} />
                    {fmt(e.baseAmount)}
                  </TableCell>

                  {/* ✅ Discount */}
                  <TableCell className="text-right text-sm text-red-500">
                    {e.discountApplied > 0 ? (
                      <>
                        − <CurrencyIcon currency={e.currency} />
                        {fmt(e.discountApplied)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Commission */}
                  <TableCell className="text-right text-sm text-orange-500">
                    {e.platformFee > 0 ? (
                      <>
                        − <CurrencyIcon currency={e.currency} />
                        {fmt(e.platformFee)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Final Earning */}
                  <TableCell className="text-right font-semibold text-green-600">
                    <CurrencyIcon currency={e.currency} />
                    {fmt(e.earnedAmount)}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="text-right">
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
      </div>
    </div>
  );
}
