/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Search } from "lucide-react";

import { getAvatarColor, getInitials } from "@/utils/getInitials";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

// ─────────────────────────────
// TYPES
// ─────────────────────────────
type Student = {
  userId: string;
  programId: string;
  programName: string;
  name: string;
  email: string;
  image?: string;
  enrolledAt: string;
  currentDay: number;
  progressPercent: number;
  certificateStatus: "ISSUED" | "NOT_ISSUED";
  certificateUrl?: string | null;
  isCompletedProgram: boolean;
};

type ProgramOption = {
  id: string;
  name: string;
};

type StudentsResponse = {
  totalStudents: number;
  page: number;
  totalPages: number;
  students: Student[];
};

type ProgramsResponse = {
  programs: ProgramOption[];
};

type StatusFilter = "all" | "issued" | "not_issued";
type CompletionFilter = "all" | "completed" | "not_completed";

// ─────────────────────────────
// MAIN
// ─────────────────────────────
export default function MMPEnrolledStudentsPageComponent({
  programId,
}: {
  programId?: string;
}) {
  const [openCert, setOpenCert] = useState(false);
  const [selectedCert, setSelectedCert] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>(
    programId || "all",
  );

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [completion, setCompletion] = useState<CompletionFilter>("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [dateMode, setDateMode] = useState<"days" | "custom">("days");
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ─────────────────────────────
  // PROGRAMS (STRICT CACHE)
  // ─────────────────────────────
  const { data: programsData } = useQuery<ProgramsResponse>({
    queryKey: ["mmp-programs"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/mini-mastery-programs/get-enrolled-students",
        { params: { onlyPrograms: true } },
      );
      return res.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // ─────────────────────────────
  // STUDENTS
  // ─────────────────────────────
  const { data, isLoading } = useQuery<StudentsResponse>({
    queryKey: [
      "mmp-students",
      selectedProgram,
      debouncedSearch,
      status,
      completion,
      page,
      limit,
      dateMode,
      dateFilter,
      customFrom,
      customTo,
    ],
    queryFn: async () => {
      const res = await axios.get(
        "/api/mini-mastery-programs/get-enrolled-students",
        {
          params: {
            programId: selectedProgram !== "all" ? selectedProgram : undefined,
            search: debouncedSearch,
            status,
            completion,
            page,
            limit,
            dateMode,
            dateFilter,
            from: customFrom,
            to: customTo,
          },
        },
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // ─────────────────────────────
  // RESET PAGE
  // ─────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [
    selectedProgram,
    debouncedSearch,
    status,
    completion,
    limit,
    dateMode,
    dateFilter,
    customFrom,
    customTo,
  ]);

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-8xl mx-auto space-y-6">
      
      {/* FILTERS */}
      <div className="flex flex-col gap-3">
        {/* SEARCH */}
        {/* SEARCH (FULL WIDTH ALWAYS) */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
          <Input
            placeholder="Search student..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* FILTER GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* PROGRAM */}
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programsData?.programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* STATUS */}
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="not_issued">Not Issued</SelectItem>
            </SelectContent>
          </Select>

          {/* COMPLETION */}
          <Select
            value={completion}
            onValueChange={(v) => setCompletion(v as CompletionFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Completion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_completed">Not Completed</SelectItem>
            </SelectContent>
          </Select>
          {/* LIMIT (Per Page) */}
          <Select
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Per Page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / page</SelectItem>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
          {/* DATE MODE */}
          <Select
            value={dateMode}
            onValueChange={(v: "days" | "custom") => setDateMode(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Date Mode" />
            </SelectTrigger>
            <SelectContent className="max-sm:w-full ">
              <SelectItem value="days">Last Days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* DATE FILTER */}
          {dateMode === "days" && (
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          )}

          {dateMode === "custom" && (
            <div className="col-span-2 lg:col-span-6 grid grid-cols-2 gap-3">
              <Input
                type="date"
                className="w-full"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                onFocus={(e) => e.target.showPicker?.()}
              />

              <Input
                type="date"
                className="w-full"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                onFocus={(e) => e.target.showPicker?.()}
              />
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Current Day</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </TableCell>

                    <TableCell>
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>

                    <TableCell>
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </TableCell>

                    <TableCell>
                      <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                    </TableCell>

                    <TableCell>
                      <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                data?.students?.map((s) => (
                  <TableRow key={`${s.userId}-${s.programId}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/profile/${s.userId}`}
                          className="shrink-0"
                          target="_blank"
                        >
                          {s.image ? (
                            <Image
                              height={40}
                              width={40}
                              src={s.image}
                              alt={s.name}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <Avatar name={s.name} />
                          )}
                        </Link>

                        <div>
                          <Link
                            href={`/profile/${s.userId}`}
                            className="text-sm font-medium hover:underline"
                            target="_blank"
                          >
                            {s.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{s.programName}</TableCell>

                    <TableCell>
                      {format(new Date(s.enrolledAt), "MMM d, yyyy")}
                    </TableCell>

                    <TableCell>Day {s.currentDay}</TableCell>

                    <TableCell>{s.progressPercent}%</TableCell>

                    <TableCell>
                      {s.certificateStatus === "ISSUED" && s.certificateUrl ? (
                        <Badge
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedCert(s.certificateUrl || null);
                            setOpenCert(true);
                          }}
                        >
                          Issued
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Issued</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* PAGINATION */}
          <div className="flex flex-col items-center py-4 gap-2">
            <p className="text-sm text-muted-foreground">
              Page {data?.page} of {data?.totalPages}
            </p>
            <Pagination
              currentPage={data?.page || 1}
              totalPages={data?.totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>
      <Dialog open={openCert} onOpenChange={setOpenCert}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>

          {selectedCert && (
            <img
              src={selectedCert}
              alt="Certificate"
              className="w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────
// COMPONENTS
// ─────────────────────────────
function Avatar({ name }: { name: string }) {
  return (
    <div
      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(
        name,
      )}`}
    >
      {getInitials(name)}
    </div>
  );
}
