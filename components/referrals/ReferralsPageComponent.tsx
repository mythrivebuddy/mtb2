/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, } from "lucide-react";
import { Pagination } from "../ui/pagination";
import { getAvatarColor, getInitials } from "@/utils/getInitials";
import Image from "next/image";
import Link from "next/link";
import { maskEmail } from "@/utils/mask-email";

// ─── Types ─────────────────────────────────────

export interface Referral {
    id: string;
    name: string;
    email: string;
    joinedAt: string;
    rewardEarned: number;
    avatar?: string | null;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface ReferralResponse {
    referrals: Referral[];
    pagination: PaginationData;
}

// ─── API ─────────────────────────────────────

async function fetchReferrals(params: {
    page: number;
    limit: number;
    search: string;
    days: string;
}): Promise<ReferralResponse> {
    const res = await axios.get<ReferralResponse>(
        "/api/refer-friend/list",
        { params }
    );
    return res.data;
}
const formatDateTime = (iso: string): string => {
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
};

// ─── Debounce Hook ────────────────────────────

function useDebounce(value: string, delay: number): string {
    const [debounced, setDebounced] = useState<string>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

// ─── Toolbar ──────────────────────────────────

function TableToolbar({
    search,
    setSearch,
    pageSize,
    setPageSize,
    dateFilter,
    setDateFilter,
    onRefetch,
    isFetching,
    setPage, 
}: {
    search: string;
    setSearch: (v: string) => void;
    pageSize: number;
    setPageSize: (v: number) => void;
    dateFilter: string;
    setDateFilter: (v: string) => void;
    onRefetch: () => void;
    isFetching: boolean;
     setPage: (v: number) => void; 
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9"
                />
            </div>

            <div className="flex items-center gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-9 w-[140px]">
                        <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="60">Last 60 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                        <SelectItem value="180">Last 6 Months</SelectItem>
                        <SelectItem value="365">Last 1 Year</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                        setPageSize(Number(v));
                        setPage(1); // ✅ Reset page
                    }}
                >
                    <SelectTrigger className="h-9 w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[5, 10, 20, 50].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={onRefetch}
                    disabled={isFetching}
                >
                    <RefreshCw
                        className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────

export default function ReferralsPageComponent() {
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [dateFilter, setDateFilter] = useState<string>("30");

    const debouncedSearch = useDebounce(search, 500);


    const { data, isLoading, isFetching, refetch } = useQuery<ReferralResponse>({
        queryKey: [
            "referrals",
            page,
            pageSize,
            debouncedSearch,
            dateFilter,
        ],
        queryFn: () =>
            fetchReferrals({
                page,
                limit: pageSize,
                search: debouncedSearch,
                days: dateFilter,
            }),

        // ✅ Keep previous page data while loading new page
        placeholderData: (prev) => prev,

        // ✅ Data stays fresh for 2 minutes (no refetch)
        staleTime: 1000 * 60 * 2,

        // ✅ Cache stays in memory for 10 minutes
        gcTime: 1000 * 60 * 10,

        // ✅ Do NOT refetch when user switches tab
        refetchOnWindowFocus: false,

        // ✅ Do NOT refetch when component remounts
        refetchOnMount: false,

        // ✅ Retry once if API fails
        retry: 1,
    });

    const referrals: Referral[] = data?.referrals ?? [];
    const totalPages: number = data?.pagination.totalPages ?? 1;

    return (
        <div className="max-w-8xl px-4 sm:px-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Referrals</h1>
                <p className="text-muted-foreground mt-1">
                    Track everyone you've referred and the rewards you've earned.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Referred Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TableToolbar
                        search={search}
                        setSearch={setSearch}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        dateFilter={dateFilter}
                        setDateFilter={setDateFilter}
                        onRefetch={refetch}
                        isFetching={isFetching}
                           setPage={setPage}
                    />

                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-[40px] text-center text-xs">
                                        #
                                    </TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Registration Date
                                    </TableHead>
                                    <TableHead className="text-right">GP Earned</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Skeleton className="h-10 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ) : referrals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No referrals found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    referrals.map((r: Referral, idx: number) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="text-center text-xs">
                                                {(page - 1) * pageSize + idx + 1}
                                            </TableCell>

                                            <TableCell>
                                                <Link
                                                    href={`/profile/${r.id}`}
                                                    target="_blank"
                                                    className="flex items-center gap-3"
                                                >
                                                    <div
                                                        className={`relative h-9 w-9 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-semibold ${r.avatar ? "" : getAvatarColor(r.name)
                                                            }`}
                                                    >
                                                        {r.avatar ? (
                                                            <Image
                                                                src={r.avatar}
                                                                alt={r.name}
                                                                fill
                                                                sizes="36px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span>{getInitials(r.name)}</span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold">{r.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                              {maskEmail(r.email)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </TableCell>

                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                                {formatDateTime(r.joinedAt)}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Badge variant="outline">
                                                    +{r.rewardEarned.toLocaleString()} GP
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </CardContent>
            </Card>
        </div>
    );
}