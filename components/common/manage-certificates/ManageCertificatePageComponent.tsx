"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import SignaturePad from "react-signature-canvas";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Award,
  PenLine,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Great_Vibes } from "next/font/google";
import { Pagination } from "@/components/ui/pagination";
import { getAvatarColor, getInitials } from "@/utils/getInitials";
import Image from "next/image";
import Link from "next/link";
import { maskEmail } from "@/utils/mask-email";
import { useDebounce } from "@/hooks/use-debounce";

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
});

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
type FilterType = "all" | "eligible" | "not_eligible" | "issued";
type SignatureType = "DRAWN" | "IMAGE" | "TEXT";
type activeTabType = "all" | "challenges" | "mmp";

interface Signature {
  id: string;
  userId: string;
  type: SignatureType;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface SignatureResponse {
  signature: Signature;
}
interface ParticipantsProgressResponse {
  participantId: string;
  name: string;
  email: string;
  avatar: string | null;
  programId: string;
  programTitle: string;
  joinedAt: string;
  lastActiveDate: string;
  completedDays: number;
  totalDays: number;
  completionPercentage: number;
  isCertificateIssued: boolean;
  programType: "CHALLENGE" | "MMP";
  certificateUrl?: string | null;
}
interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  completionPercentage: number;
  joinedDate: string;
  lastActiveDate: string;
  isCertificateIssued: boolean;
  programTitle: string;
  programId: string;
  programType: "CHALLENGE" | "MMP";
  certificateUrl?: string | null;
}

interface ProgramRow {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  participants: Participant[];
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const getStatus = (p: Participant): "eligible" | "not_eligible" | "issued" => {
  if (p.isCertificateIssued) return "issued";
  if (p.completionPercentage >= 75) return "eligible";
  return "not_eligible";
};

type FetchParticipantsParams = {
  type: "all" | "challenges" | "mmp";
  page: number;
  limit: number;
  search: string;
  status: "all" | "eligible" | "not_eligible" | "issued";
  from?: string;
  to?: string;
};

const fetchParticipants = async ({
  type,
  page,
  limit,
  search,
  status,
  from,
  to,
}: FetchParticipantsParams): Promise<PaginatedResponse> => {
  const res = await axios.get(
    `/api/challenge/certificates/participant-progress`,
    {
      params: { type, page, limit, search, status, from, to },
    },
  );

  return res.data;
};

type PaginatedResponse = {
  participants: ParticipantsProgressResponse[];
  total: number;
  totalPages: number;
  page: number;
};
// ─────────────────────────────────────────────
//  SIGNATURE PAD COMPONENT
// ─────────────────────────────────────────────
export function SignaturePadDialog({
  open,
  onClose,
  onSave,
  isUploading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  isUploading: boolean;
}) {
  const padRef = useRef<SignaturePad>(null);

  const handleClear = () => {
    padRef.current?.clear();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sign Your Signature</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <SignaturePad
            ref={padRef}
            penColor="#000"
            canvasProps={{
              width: 450,
              height: 200,
              className: "border rounded-md bg-white",
            }}
          />

          <div className="flex gap-4 pt-3">
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={isUploading}
            >
              Clear
            </Button>

            <Button
              onClick={async () => {
                if (!padRef.current) return;
                const dataUrl = padRef.current
                  .getCanvas()
                  .toDataURL("image/png");
                await onSave(dataUrl); // wait for upload
              }}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Signature"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
//  SIGNATURE DIALOG
// ─────────────────────────────────────────────
interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenPad: () => void;
  isUploading: boolean;
  onUploadImage: (file: File) => Promise<void>;
  onSaveText: (text: string) => Promise<void>;
  signaturePreview: string | null;
  signatureTextPreview: string | null;
}

export function SignatureDialog({
  open,
  onClose,
  onOpenPad,
  isUploading,
  onUploadImage,
  onSaveText,
  signaturePreview,
  signatureTextPreview,
}: SignatureDialogProps) {
  const [mode, setMode] = useState<"upload" | "text" | null>(null);
  const [sigText, setSigText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setMode(null);
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <PenLine className="w-4 h-4 text-indigo-600" />
            Manage Certificate Signature
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Choose how you would like to add your signature to all issued
            certificates.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          {/* Options Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode("upload")}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all ${
                mode === "upload"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </button>
            <button
              onClick={() => setMode("text")}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all ${
                mode === "text"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <PenLine className="w-5 h-5" />
              Type Text
            </button>
            <button
              onClick={() => {
                setMode(null);
                onOpenPad();
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            >
              <Pencil className="w-5 h-5" />
              Draw Pad
            </button>
          </div>

          {/* Current Signature Preview */}
          {(signaturePreview || signatureTextPreview) && (
            <div className="border rounded-xl p-4 bg-white text-center">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Current Signature
              </p>

              {signaturePreview && (
                <img
                  src={signaturePreview}
                  alt="Signature preview"
                  className="h-16 mx-auto object-contain"
                />
              )}

              {signatureTextPreview && (
                <p
                  className={`text-3xl text-[#1E3A8A] ${greatVibes.className}`}
                >
                  {signatureTextPreview}
                </p>
              )}
            </div>
          )}
          {/* Loading Indicator */}

          {/* Upload Mode */}
          {mode === "upload" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Upload New Signature
              </p>

              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSelectedFile(file);
                }}
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:cursor-pointer"
              />

              {previewUrl && (
                <div className="border rounded-xl p-4 bg-white text-center">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    New Preview
                  </p>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-16 mx-auto object-contain"
                  />
                </div>
              )}

              <Button
                disabled={!selectedFile || isUploading}
                onClick={() => {
                  if (!selectedFile) return;
                  onUploadImage(selectedFile);
                  setSelectedFile(null);
                }}
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload New Signature"
                )}
              </Button>
            </div>
          )}

          {/* Text Mode */}
          {mode === "text" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Type Signature
              </p>
              <Input
                placeholder="Your name or signature…"
                value={sigText}
                disabled={isUploading}
                onChange={(e) => setSigText(e.target.value)}
                className="h-9 text-sm"
              />
              {sigText && !isUploading && (
                <div className="border rounded-xl p-4 bg-white text-center">
                  <p
                    className={`text-3xl text-slate-700 ${greatVibes.className}`}
                  >
                    {sigText}
                  </p>
                </div>
              )}
              <Button
                disabled={!sigText || isUploading}
                onClick={() => onSaveText(sigText)}
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {isUploading ? "Saving..." : "Save Signature"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
//  PARTICIPANTS TABLE
// ─────────────────────────────────────────────
type ParticipantsTableProps = {
  programs: ProgramRow[];
  isLoading?: boolean;
  onIssue: (participantId: string, programId: string) => void;
  onPreview: (participantId: string, programId: string, name: string) => void;
  issuingId: string | null;
  activeTab: activeTabType;
  setActiveTab: (tab: activeTabType) => void;

  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  limit: number;
  setLimit: (limit: number) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filter: FilterType;
  onFilterChange: (v: FilterType) => void;

  // ADD THESE
  dateMode: "days" | "custom";
  setDateMode: (v: "days" | "custom") => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
};
function ParticipantsTable({
  programs,
  isLoading = false,
  onIssue,
  onPreview,
  issuingId,
  activeTab,
  setActiveTab,
  currentPage,
  totalPages,
  onPageChange,
  limit,
  setLimit,
  search,
  onSearchChange,
  filter,
  onFilterChange,

  // ADD THESE
  dateMode,
  setDateMode,
  dateFilter,
  setDateFilter,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: ParticipantsTableProps) {
  const paginatedData = useMemo(() => {
    return programs.flatMap((p) => p.participants);
  }, [programs]);

  const handleIssueClick = (p: Participant) => {
    onIssue(p.id, p.programId);
  };
  useEffect(() => {
    onPageChange(1);
  }, [filter, activeTab, limit, dateMode, dateFilter, customFrom, customTo]);
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search by name, challenge or program…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm w-full"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filter}
          onValueChange={(v) => onFilterChange(v as FilterType)}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Participants</SelectItem>
            <SelectItem value="eligible">Eligible</SelectItem>
            <SelectItem value="not_eligible">Not Eligible</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
          </SelectContent>
        </Select>

        {/* Limit */}
        <Select
          value={String(limit)}
          onValueChange={(val) => {
            setLimit(Number(val));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[90px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 / page</SelectItem>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Mode */}
        <Select
          value={dateMode}
          onValueChange={(val) => {
            setDateMode(val as "days" | "custom");
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="days">Last Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {/* Days Filter */}
        {dateMode === "days" && (
          <Select
            value={dateFilter}
            onValueChange={(val) => {
              setDateFilter(val);
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Custom Date */}
        {dateMode === "custom" && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                onPageChange(1);
              }}
              className="h-9 text-sm w-full"
            />
            <Input
              type="date"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                onPageChange(1);
              }}
              className="h-9 text-sm w-full"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-x-auto w-full border rounded-lg">
        {/* ── Tabs ── */}
        <Tabs
          value={activeTab}
          onValueChange={(val) =>
            setActiveTab(val as "all" | "challenges" | "mmp")
          }
          className="mb-6 flex justify-center"
        >
          <TabsList className="flex flex-row w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="mmp">Mini Mastery Programs</TabsTrigger>
          </TabsList>
        </Tabs>
        <CardContent>
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Participant</TableHead>
                <TableHead>
                  {activeTab === "all"
                    ? "Challenge / Program"
                    : activeTab === "challenges"
                      ? "Challenge"
                      : "Program"}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No participants found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((p) => {
                  const status = getStatus(p);
                  const isIssuingThis = issuingId === p.id;

                  return (
                    <TableRow key={`${p.id}-${p.programId}-${p.programType}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`relative h-8 w-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-semibold
                                                    ${p.avatar ? "" : getAvatarColor(p.name)}`}
                          >
                            {p.avatar ? (
                              <Image
                                src={p.avatar}
                                alt={p.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="leading-none">
                                {getInitials(p.name)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <Link
                              href={`/profile/${p?.id}`}
                              target="_blank"
                              className="text-sm font-medium text-slate-900"
                            >
                              {p.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {maskEmail(p.email)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center text-xs font-medium rounded-md px-2 py-0.5 max-w-[180px] truncate">
                          {p.programTitle}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            status === "issued"
                              ? "default"
                              : status === "eligible"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {status === "issued"
                            ? "Issued"
                            : status === "eligible"
                              ? "Eligible"
                              : "Not Eligible"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">
                            {p.completionPercentage}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        Joined: {format(new Date(p.joinedDate), "MMM d, yyyy")}
                        <br />
                        Active:{" "}
                        {format(new Date(p.lastActiveDate), "MMM d, yyyy")}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3 text-xs font-medium">
                          {p.programType === "CHALLENGE" &&
                            status === "eligible" && (
                              <span
                                onClick={() => handleIssueClick(p)}
                                className={`cursor-pointer text-indigo-600 hover:text-indigo-800 ${
                                  isIssuingThis
                                    ? "opacity-50 pointer-events-none"
                                    : ""
                                }`}
                              >
                                {isIssuingThis ? (
                                  <span className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Issuing
                                  </span>
                                ) : (
                                  "Issue Certificate"
                                )}
                              </span>
                            )}

                          {p.isCertificateIssued && (
                            <span
                              onClick={() =>
                                onPreview(p.id, p.programId, p.name)
                              }
                              className="cursor-pointer text-green-600 hover:text-green-800"
                            >
                              Preview
                            </span>
                          )}

                          {status === "not_eligible" && (
                            <span className="text-rose-500">Not Eligible</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
export default function ManageCertificatePageComponent() {
  const session = useSession();
  const [activeTab, setActiveTab] = useState<activeTabType>("all");
  const [sigDialogOpen, setSigDialogOpen] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewParticipantName, setPreviewParticipantName] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [dateMode, setDateMode] = useState<"days" | "custom">("days");
  const [dateFilter, setDateFilter] = useState("30");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const sharedOptions: Omit<
    UseQueryOptions<PaginatedResponse>,
    "queryKey" | "queryFn"
  > = {
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  };

  const { from, to } = useMemo(() => {
    if (dateMode === "custom" && customFrom && customTo) {
      return {
        from: new Date(customFrom).toISOString(),
        to: new Date(customTo).toISOString(),
      };
    }

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - Number(dateFilter));

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }, [dateMode, dateFilter, customFrom, customTo]);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["pp", activeTab, page, limit, debouncedSearch, filter, from, to],
    queryFn: () =>
      fetchParticipants({
        type: activeTab,
        page,
        limit,
        search: debouncedSearch,
        status: filter,
        from,
        to,
      }),
    ...sharedOptions,
  });

  const { data: signatureData } = useQuery<SignatureResponse>({
    queryKey: ["coach-signature"],
    queryFn: async () => {
      const res = await axios.get(`/api/signature`);
      return res.data;
    },
  });

  const issueCertificateMutation = useMutation({
    mutationFn: async ({
      participantId,
      challengeId,
      issuedById,
    }: {
      participantId: string;
      challengeId: string;
      issuedById: string;
    }) => {
      setIssuingId(participantId);

      // SHOW LOADING TOAST
      toast.loading("Generating certificate...", {
        id: "cert-issue",
      });

      const res = await axios.post("/api/challenge/certificates/generate", {
        participantId,
        challengeId,
        issuedById,
      });

      return res.data;
    },

    onSuccess: (result, variables) => {
      setIssuingId(null);

      // UPDATE CACHE
      queryClient.setQueriesData(
        { queryKey: ["pp"] },
        (oldData: PaginatedResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            participants: oldData.participants.map((p) =>
              p.participantId === variables.participantId &&
              p.programId === variables.challengeId
                ? {
                    ...p,
                    isCertificateIssued: true,
                    certificateUrl: result.pngUrl,
                  }
                : p,
            ),
          };
        },
      );

      const participantName =
        allParticipants.find((p) => p.id === variables.participantId)?.name ??
        "Participant";

      setPreviewUrl(result.pngUrl);
      setPreviewParticipantName(participantName);
      setPreviewOpen(true);

      // UPDATE TOAST → SUCCESS
      toast.success(`Certificate issued to ${participantName}`, {
        id: "cert-issue",
      });
    },

    onError: () => {
      setIssuingId(null);

      // UPDATE TOAST → ERROR
      toast.error("Failed to issue certificate", {
        id: "cert-issue",
      });
    },
  });
  const signaturePreviewData =
    signatureData?.signature?.type === "IMAGE" ||
    signatureData?.signature?.type === "DRAWN"
      ? signatureData?.signature?.imageUrl
      : null;

  const signatureTextPreviewData =
    signatureData?.signature?.type === "TEXT"
      ? signatureData?.signature?.text
      : null;
  const groupedPrograms = useMemo(() => {
    if (!data?.participants) return [];

    const grouped: Record<string, ProgramRow> = {};

    data.participants.forEach((p: ParticipantsProgressResponse) => {
      if (!grouped[p.programId]) {
        grouped[p.programId] = {
          id: p.programId,
          title: p.programTitle,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          participants: [],
        };
      }

      grouped[p.programId].participants.push({
        id: p.participantId,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        completionPercentage: p.completionPercentage,
        joinedDate: p.joinedAt,
        lastActiveDate: p.lastActiveDate,
        isCertificateIssued: p.isCertificateIssued,
        programTitle: p.programTitle,
        programId: p.programId,
        certificateUrl: p.certificateUrl,
        programType: p.programType,
      });
    });

    return Object.values(grouped);
  }, [data]);

  const activeData = groupedPrograms;
  const isActiveLoading = isLoading;
  // Signature State Handlers
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleIssue = (participantId: string, programId: string) => {
    issueCertificateMutation.mutate({
      participantId,
      challengeId: programId,
      issuedById: session.data?.user?.id as string,
    });
  };

  const handlePreview = (
    participantId: string,
    programId: string,
    name: string,
  ) => {
    const participant = allParticipants.find(
      (p) => p.id === participantId && p.programId === programId,
    );

    if (!participant?.certificateUrl) {
      toast.error("Certificate not found");
      return;
    }

    setPreviewUrl(participant.certificateUrl);
    setPreviewParticipantName(name);
    setPreviewOpen(true);
  };

  const allParticipants = activeData.flatMap((c) => c.participants);
  const totalEligible = allParticipants.filter(
    (p) => p.completionPercentage >= 75 && !p.isCertificateIssued,
  ).length;
  const totalIssued = allParticipants.filter(
    (p) => p.isCertificateIssued,
  ).length;
  const totalNotEligible = allParticipants.filter(
    (p) => p.completionPercentage < 75 && !p.isCertificateIssued,
  ).length;

  const uploadSignatureAxios = async (
    form: FormData,
  ): Promise<string | null> => {
    try {
      setIsSignatureUploading(true);
      const { data } = await axios.post("/api/signature", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // For IMAGE / DRAWN signatures, backend returns `imageUrl`
      const imageUrl: string | null = data?.signature?.imageUrl ?? null;
      return imageUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
            error.message ||
            "Signature upload failed",
        );
      } else {
        toast.error("Signature upload failed");
      }
      throw error;
    } finally {
      setIsSignatureUploading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  return (
    <>
      {/* Main Upload / Text UI Dialog */}
      <SignatureDialog
        open={sigDialogOpen}
        onClose={() => setSigDialogOpen(false)}
        onOpenPad={() => setShowSignaturePad(true)}
        isUploading={isSignatureUploading}
        signaturePreview={signaturePreviewData}
        signatureTextPreview={signatureTextPreviewData}
        onUploadImage={async (file) => {
          const form = new FormData();
          form.append("type", "IMAGE");
          form.append("file", file);

          const imageUrl = await uploadSignatureAxios(form);

          if (imageUrl) {
            queryClient.setQueryData<SignatureResponse>(
              ["coach-signature"],
              (oldData) => {
                const userId =
                  oldData?.signature?.userId ?? session.data?.user?.id ?? "";

                if (!userId) return oldData; // prevent invalid cache

                return {
                  signature: {
                    id: oldData?.signature?.id ?? crypto.randomUUID(),
                    userId,
                    createdAt:
                      oldData?.signature?.createdAt ?? new Date().toISOString(),
                    type: "DRAWN",
                    imageUrl: imageUrl,
                    text: null,
                  },
                };
              },
            );

            toast.success("Signature image saved.");
            setSigDialogOpen(false); // ← ADD THIS LINE
          }
        }}
        onSaveText={async (text) => {
          const form = new FormData();
          form.append("type", "TEXT");
          form.append("text", text);
          await uploadSignatureAxios(form);
          queryClient.setQueryData<SignatureResponse>(
            ["coach-signature"],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                signature: {
                  id: oldData.signature.id,
                  userId: oldData.signature.userId,
                  createdAt: oldData.signature.createdAt,
                  type: "TEXT",
                  text: text,
                  imageUrl: null,
                },
              };
            },
          );
          toast.success("Signature text saved.");
          setSigDialogOpen(false); // Closes the dialog after saving
        }}
      />

      {/* Drawing Pad Dialog */}
      <SignaturePadDialog
        open={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        isUploading={isSignatureUploading}
        onSave={async (dataUrl: string) => {
          const form = new FormData();
          form.append("type", "DRAWN");
          form.append("dataUrl", dataUrl);

          const imageUrl = await uploadSignatureAxios(form);

          if (imageUrl) {
            queryClient.setQueryData<SignatureResponse>(
              ["coach-signature"],
              (oldData) => {
                if (!oldData) return oldData;

                return {
                  signature: {
                    id: oldData.signature.id,
                    userId: oldData.signature.userId,
                    createdAt: oldData.signature.createdAt,
                    type: "DRAWN",
                    imageUrl: imageUrl,
                    text: null,
                  },
                };
              },
            );

            toast.success("Drawn signature saved.");
            setShowSignaturePad(false); // CLOSE AFTER SUCCESS
          }
        }}
      />
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
            <DialogDescription>
              Certificate issued to {previewParticipantName}
            </DialogDescription>
          </DialogHeader>

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Certificate Preview"
              className="w-full rounded-lg border"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="p-4 sm:p-6 max-w-8xl mx-auto">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-3xl font-bold">Certificate Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Issue certificates to eligible participants and manage your
              signature for certificates.
            </p>
          </div>

          <button
            onClick={() => setSigDialogOpen(true)}
            className="px-4 py-2 max-sm:w-full bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
          >
            Manage Signature
          </button>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Eligible */}
          <div className="rounded-xl border bg-white p-4 shadow-sm min-h-[110px] flex flex-col justify-between text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Eligible
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {totalEligible}
            </p>
          </div>

          {/* Not Eligible */}
          <div className="rounded-xl border bg-white p-4 shadow-sm min-h-[110px] flex flex-col justify-between text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Not Eligible
              </span>
            </div>
            <p className="text-3xl font-bold text-rose-500">
              {totalNotEligible}
            </p>
          </div>

          {/* Issued */}
          <div className="rounded-xl border bg-white p-4 shadow-sm min-h-[110px] flex flex-col justify-between text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Issued
              </span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{totalIssued}</p>
          </div>
        </div>

        {/* ── Table Panel ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {activeTab === "all"
                ? "All Challenges & MMP Participants"
                : activeTab === "challenges"
                  ? "Challenge Participants"
                  : "Mini Mastery Participants"}
            </h2>
            <p className="text-xs text-slate-400">
              {allParticipants.length} participants across {activeData.length}{" "}
              {activeTab === "challenges" ? "challenges" : "programs"}
            </p>
          </div>

          <ParticipantsTable
            programs={activeData}
            isLoading={isActiveLoading}
            onIssue={handleIssue}
            issuingId={issuingId}
            activeTab={activeTab}
            onPreview={handlePreview}
            setActiveTab={setActiveTab}
            currentPage={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
            limit={limit}
            setLimit={setLimit}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            dateMode={dateMode}
            setDateMode={setDateMode}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
          />
        </div>
      </div>
    </>
  );
}
