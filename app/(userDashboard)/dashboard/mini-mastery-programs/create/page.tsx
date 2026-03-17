"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, TrendingUp, Users, CheckCircle, Star,
  Filter, Lightbulb, HelpCircle,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
  X, Send, Pencil,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { ApiResponse, Pagination, Program, ProgramStatus } from "@/types/client/mini-mastery-program";


// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string }> = {
  PUBLISHED:    { label: "Published",    color: "bg-green-100 text-green-700" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-700"  },
  DRAFT:        { label: "Draft",        color: "bg-gray-100 text-gray-600"  },
};

const ALL_STATUSES: ProgramStatus[] = ["PUBLISHED", "UNDER_REVIEW", "DRAFT"];

function formatCurrency(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "Free";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${price.toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function moduleCount(modules: unknown): number {
  if (!Array.isArray(modules)) return 0;
  return modules.length;
}



// ─── Component ────────────────────────────────────────────────────────────────

const LIMIT = 8;

export default function Dashboard() {
  const [programs, setPrograms]       = useState<Program[]>([]);
  const [pagination, setPagination]   = useState<Pagination>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "ALL">("ALL");
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/mini-mastery-programs?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? `Error ${res.status}`);
      }
      const data = await res.json() as ApiResponse;
      setPrograms(data.programs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { void fetchPrograms(); }, [fetchPrograms]);

  const handleStatusFilter = (s: ProgramStatus | "ALL") => {
    setStatusFilter(s);
    setPage(1);
    setShowFilterMenu(false);
  };

  // ── Submit for review ──────────────────────────────────────────────────────
  const handleSubmitForReview = async (id: string) => {
    setSubmittingId(id);
    try {
      const res = await fetch("/api/mini-mastery-programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "UNDER_REVIEW" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message ?? "Failed to update status.");
      }
      // Optimistic update in local state
      setPrograms((prev) =>
        prev.map((p) => p.id === id ? { ...p, status: "UNDER_REVIEW" } : p)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmittingId(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "TOTAL PROGRAMS",
      value: String(pagination.total),
      trend: `${programs.filter(p => p.status === "PUBLISHED").length} published`,
      icon: <TrendingUp className="text-green-500" size={20} />,
      bg: "bg-green-50",
    },
    {
      label: "ACTIVE PROGRAMS",
      value: String(programs.filter(p => p.isActive).length),
      trend: "Currently active",
      icon: <Users className="text-blue-500" size={20} />,
      bg: "bg-blue-50",
    },
    {
      label: "UNDER REVIEW",
      value: String(programs.filter(p => p.status === "UNDER_REVIEW").length),
      trend: "Awaiting approval",
      icon: <CheckCircle className="text-orange-500" size={20} />,
      bg: "bg-orange-50",
    },
    {
      label: "AVG. PRICE",
      value: (() => {
        const paid = programs.filter(p => p.price && p.price > 0);
        if (!paid.length) return "Free";
        const avg = paid.reduce((s, p) => s + (p.price ?? 0), 0) / paid.length;
        return `₹${Math.round(avg)}`;
      })(),
      trend: `${programs.filter(p => !p.price || p.price === 0).length} free programs`,
      icon: <Star className="text-yellow-500" size={20} />,
      bg: "bg-yellow-50",
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              Mini-Mastery Programs
            </h1>
            <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-lg">
              Design structured, self-paced programs for autonomous learning.
            </p>
          </div>
          <Link
            href="/dashboard/mini-mastery-programs/create/new"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Create New Program
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <span className="text-[10px] md:text-xs font-bold text-gray-400 tracking-wider uppercase">
                  {stat.label}
                </span>
                <div className={`${stat.bg} p-2 rounded-lg`}>{stat.icon}</div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-[10px] md:text-xs mt-2 font-medium text-green-500">{stat.trend}</div>
            </div>
          ))}
        </div>

        {/* Programs Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Table Header */}
          <div className="p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Your Programs</h2>
              {!loading && (
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {pagination.total}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {statusFilter !== "ALL" && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_CONFIG[statusFilter].color}`}>
                  {STATUS_CONFIG[statusFilter].label}
                  <button onClick={() => handleStatusFilter("ALL")}><X size={12} /></button>
                </div>
              )}

              <div className="relative ml-auto sm:ml-0">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`p-2 border rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium ${
                    showFilterMenu ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50 text-gray-500"
                  }`}
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => handleStatusFilter("ALL")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === "ALL" ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        All Programs
                      </button>
                      {ALL_STATUSES.map((s) => (
                        <button key={s} onClick={() => handleStatusFilter(s)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === s ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-600"
                          }`}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => void fetchPrograms()} disabled={loading}
                className="p-2 border rounded-lg hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-40" title="Refresh">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 my-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-6 py-4">Program Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Modules</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">

                {loading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
                        <div className="space-y-2">
                          <div className="h-3.5 w-40 bg-gray-100 rounded" />
                          <div className="h-2.5 w-24 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
                    ))}
                  </tr>
                ))}

                {!loading && programs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Plus size={20} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm">
                          {statusFilter !== "ALL"
                            ? `No ${STATUS_CONFIG[statusFilter].label.toLowerCase()} programs found.`
                            : "No programs yet. Create your first one!"}
                        </p>
                        {statusFilter !== "ALL" && (
                          <button onClick={() => handleStatusFilter("ALL")}
                            className="text-blue-600 text-sm font-bold underline underline-offset-4">
                            Clear filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && programs.map((program) => {
                  const statusKey = (program.status ?? "DRAFT") as ProgramStatus;
                  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;

                  return (
                    <tr key={program.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {program.thumbnailUrl ? (
                            <img src={program.thumbnailUrl} alt={program.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center shrink-0 border border-blue-50 text-blue-600 font-black text-sm">
                              {program.durationDays ?? "?"}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-800 text-sm md:text-base leading-tight">{program.name}</div>
                            <div className="text-[11px] md:text-xs text-gray-400 mt-0.5">
                              {program.unlockType === "daily" ? "Daily unlock" : "All unlocked"} •{" "}
                              {program.durationDays ?? "?"} days
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-600 text-sm">
                        {moduleCount(program.modules)} modules
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-800 text-sm">
                        {formatCurrency(program.price, program.currency)}
                      </td>

                      <td className="px-6 py-4 text-xs md:text-sm text-gray-500">
                        {formatDate(program.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Submit for Review — only for DRAFT */}
                          {program.status === "DRAFT" && (
                            <button
                              onClick={() => handleSubmitForReview(program.id)}
                              disabled={submittingId === program.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingId === program.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Send size={13} />
                              }
                              Request Review
                            </button>
                          )}
  
                            {/* Edit — available for DRAFT and PUBLISHED programs */}
                            {(program.status === "DRAFT" || program.status === "PUBLISHED") && (
                              <Link
                                href={`/dashboard/mini-mastery-programs/create/edit/${program.id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Pencil size={13} />
                              </Link>
                            )}

                          {/* view for all status */}
                          {/* /dashboard/mini-mastery-programs/program-preview/cmmors5s50007u5qouigfd4dx */}
                          <Link href={`/dashboard/mini-mastery-programs/program-preview/${program.id}`}>
                          <button
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        </Link>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex flex-col sm:flex-row justify-between items-center border-t border-gray-50 gap-4">
            <span className="text-xs md:text-sm text-gray-500">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </span>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-bold text-gray-700">
                    {pagination.total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)}
                  </span>{" "}
                  of <span className="font-bold text-gray-700">{pagination.total}</span> programs
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1)
                      acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, idx) => p === "..." ? (
                    <span key={`e-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        page === p ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-500"
                      }`}>{p}</button>
                  ))}
              </div>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
                className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
                <ChevronLeft size={16} /> Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages || loading}
                className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-green-50/50 border border-green-100 p-6 md:p-8 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-green-600 mb-3 md:mb-4 font-bold text-sm md:text-base">
              <Lightbulb size={20} /> Quick Tip: Increase Engagement
            </div>
            <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
              Add a 5-minute video introduction to each module. Programs with video openers see a 40% higher completion rate.
            </p>
            <a href="#" className="inline-block text-black font-bold text-sm underline underline-offset-4 hover:text-green-700 transition-colors">
              Read Guide
            </a>
          </div>

          <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-gray-800 mb-3 md:mb-4 font-bold text-sm md:text-base">
              <HelpCircle size={20} className="text-blue-500" /> Need Assistance?
            </div>
            <p className="text-gray-500 text-sm md:text-base mb-6 leading-relaxed">
              Our program designers are here to help you structure your course for maximum impact. Schedule a review.
            </p>
            <button className="w-full sm:w-auto px-6 py-2.5 border-2 border-gray-900 rounded-xl font-bold hover:bg-gray-900 hover:text-white transition-all active:scale-95 text-sm md:text-base">
              Book a Session
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}