"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ExternalLink, Loader2, Search, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import SortIndicator from "@/components/common/SortIndicator";
import { useServerSort } from "@/hooks/use-server-sort";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type InvoiceStatus = "PAID" | "FAILED" | "PENDING";

type Invoice = {
  id: string;
  invoiceNumber: string;
  user: {
    name: string;
    email: string;
  };
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  contextType: string;
  createdAt: string;
  pdfUrl?: string;
  emailSent?: boolean;
};

type ApiResponse = {
  success: boolean;
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
};

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

const fetchInvoices = async ({
  page,
  limit,
  search,
  status,
  contextType,
  emailSent,
  sortBy,
  sortOrder,
}: {
  page: number;
  limit: number;
  search: string;
  status?: string;
  contextType?: string;
  emailSent?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<ApiResponse> => {
  const res = await axios.get("/api/admin/invoices", {
    params: {
      page,
      limit,
      search,
      ...(status && { status }),
      ...(contextType && { contextType }),
      ...(emailSent && { emailSent }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    },
  });

  return res.data;
};

// ─────────────────────────────────────────────
// PDF VIEWER DIALOG
// ─────────────────────────────────────────────

function PdfViewerDialog({
  open,
  onClose,
  url,
  invoiceNumber,
}: {
  open: boolean;
  onClose: () => void;
  url: string | null;
  invoiceNumber: string | null;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none p-0 bg-white">
        {/* 🔥 HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
          {/* Left */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Invoice {invoiceNumber}</h2>
            <span className="text-xs text-muted-foreground">
              Preview invoice document
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {url && (
              <>
                <a
                  href={url}
                  target="_blank"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>

                <a
                  href={url}
                  download
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-black"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🔥 PDF VIEW */}
        <div className="relative w-full h-[calc(100vh-72px)] bg-slate-100">
          {/* Loader */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/70">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>
          )}

          {url ? (
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No PDF available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// TABLE COMPONENT
// ─────────────────────────────────────────────

function InvoiceTable({
  data,
  isLoading,
  onViewPdf,
  sortBy,
  sortOrder,
  onSort,
}: {
  data: Invoice[];
  isLoading: boolean;
  onViewPdf: (url: string, invoiceNumber: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => onSort("invoiceNumber")}
                className="cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1">
                  Invoice
                  <SortIndicator
                    field="invoiceNumber"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                onClick={() => onSort("userName")}
                className="cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1">
                  User
                  <SortIndicator
                    field="userName"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead>Context</TableHead>
              <TableHead
                onClick={() => onSort("totalAmount")}
                className="cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  Amount
                  <SortIndicator
                    field="totalAmount"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Sent</TableHead>
              <TableHead
                onClick={() => onSort("createdAt")}
                className="cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  Date
                  <SortIndicator
                    field="createdAt"
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
                <TableCell colSpan={8} className="text-center h-24">
                  Loading Invoices....
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              data.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {inv.invoiceNumber}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span>{inv.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {inv.user.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{inv.contextType}</Badge>
                  </TableCell>

                  <TableCell>
                    ₹{inv.totalAmount} {inv.currency}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        inv.status === "PAID"
                          ? "default"
                          : inv.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={inv.emailSent ? "default" : "secondary"}
                      className={
                        inv.emailSent
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }
                    >
                      {inv.emailSent ? "Sent" : "Pending"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {format(new Date(inv.createdAt), "MMMM dd yyyy")}
                  </TableCell>

                  <TableCell className="text-right">
                    {inv.pdfUrl && (
                      <button
                        onClick={() =>
                          onViewPdf(inv.pdfUrl!, inv.invoiceNumber)
                        }
                        className="text-blue-600 text-sm hover:underline"
                      >
                        View PDF
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function InvoicePage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const debouncedSearch = useDebounce(search, 500);

  // PDF Dialog state
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  const { sortBy, sortOrder, handleSort } = useServerSort("createdAt");
  const [contextType, setContextType] = useState("all");
  const [emailSent, setEmailSent] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: [
      "invoices",
      page,
      limit,
      debouncedSearch,
      status,
      contextType,
      emailSent,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchInvoices({
        page,
        limit,
        search: debouncedSearch,
        ...(status !== "all" && { status }),
        ...(contextType !== "all" && { contextType }),
        ...(emailSent !== "all" && { emailSent }),
        sortBy,
        sortOrder,
      }),
    staleTime: 5 * 60 * 1000,

    placeholderData: (prev) => prev,
  });

  const invoices = data?.data || [];

  const handleViewPdf = (url: string, invNumber: string) => {
    setPdfUrl(url);
    setInvoiceNumber(invNumber);
    setPdfOpen(true);
  };
  const handleSortWithReset = (field: string) => {
    setPage(1);
    handleSort(field);
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-sm text-muted-foreground">Manage all invoices</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search invoice or email..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        {/* Status */}
        <Select
          value={status}
          onValueChange={(val) => {
            setPage(1);
            setStatus(val);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
        {/* Context filter */}
        <Select
          value={contextType}
          onValueChange={(val) => {
            setPage(1);
            setContextType(val);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Context" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Context</SelectItem>
            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
            <SelectItem value="MMP_PROGRAM">MMP</SelectItem>
            <SelectItem value="CHALLENGE">Challenge</SelectItem>
            <SelectItem value="STORE_PRODUCT">Store Product</SelectItem>
          </SelectContent>
        </Select>

        {/* Email sent filter */}
        <Select
          value={emailSent}
          onValueChange={(val) => {
            setPage(1);
            setEmailSent(val);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Email Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emails</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {/* Limit */}
        <Select
          value={String(limit)}
          onValueChange={(val) => {
            setPage(1);
            setLimit(Number(val));
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <InvoiceTable
        data={invoices}
        isLoading={isLoading}
        onViewPdf={handleViewPdf}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSortWithReset}
      />

      {/* Pagination */}
      <Pagination
        currentPage={data?.pagination.page || 1}
        totalPages={data?.pagination.totalPages || 1}
        onPageChange={(p) => setPage(p)}
      />

      {/* PDF Dialog */}
      <PdfViewerDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        url={pdfUrl}
        invoiceNumber={invoiceNumber}
      />
    </div>
  );
}
