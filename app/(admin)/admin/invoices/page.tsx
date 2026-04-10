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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { maskEmail } from "@/utils/mask-email";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";

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
}: {
  page: number;
  limit: number;
  search: string;
  status: string;
}): Promise<ApiResponse> => {
  const res = await axios.get("/api/admin/invoices", {
    params: { page, limit, search, status },
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
}: {
  data: Invoice[];
  isLoading: boolean;
  onViewPdf: (url: string, invoiceNumber: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Sent</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  <Loader2 className="animate-spin mx-auto" />
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
                        {maskEmail(inv.user.email)}
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

  // PDF Dialog state
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page, limit, search, status],
    queryFn: () =>
      fetchInvoices({
        page,
        limit,
        search,
        status: status === "all" ? "" : status,
      }),
  });

  const invoices = data?.data || [];

  const handleViewPdf = (url: string, invNumber: string) => {
    setPdfUrl(url);
    setInvoiceNumber(invNumber);
    setPdfOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Manage all platform invoices
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search invoice or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
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

        <Select
          value={String(limit)}
          onValueChange={(val) => setLimit(Number(val))}
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
