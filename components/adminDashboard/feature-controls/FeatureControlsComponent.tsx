"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Settings, Plus, Save, Search, Edit2, ShieldAlert,
    Activity, Users, Box, CheckCircle2, XCircle, AlertCircle,
    ChevronRight, Code2, Braces, WrapText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type FeatureUserType = "COACH" | "ENTHUSIAST" | "SOLOPRENEUR";
export type MembershipType = "FREE" | "PAID";

export interface ConfigSchemaField {
    type: "number" | "boolean" | "string" | "select";
    label: string;
    options?: string[];
    default?: any;
}

export interface FeaturePlanConfig {
    id: string;
    membership: MembershipType;
    userType: FeatureUserType;
    isActive: boolean;
    config: Record<string, any>;
}

export interface Feature {
    id: string;
    key: string;
    name: string;
    description: string | null;
    configSchema: Record<string, ConfigSchemaField> | null;
    allowedUserTypes: FeatureUserType[];
    actions: Record<string, FeatureUserType[]> | null;
    isActive: boolean;
    planConfigs: FeaturePlanConfig[];
}

// ─────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────
const INITIAL_FEATURES: Feature[] = [
  // ---------- Growth Points ----------
  {
    id: "feat_growthPoints",
    key: "growthPoints",
    name: "Growth Points",
    description: "Reward multipliers",
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      earnRateMultiplier: { type: "number", label: "Earn Rate Multiplier", default: 1 },
      spendRateMultiplier: { type: "number", label: "Spend Rate Multiplier", default: 1 },
      bonusEligible: { type: "boolean", label: "Bonus Eligible", default: false },
    },
    planConfigs: [
      { id: "jp_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { earnRateMultiplier: 1, spendRateMultiplier: 1.2 } },
      { id: "jp_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { earnRateMultiplier: 1, spendRateMultiplier: 1.2 } },
      { id: "jp_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { earnRateMultiplier: 1.5, spendRateMultiplier: 0.8, bonusEligible: true } },
      { id: "jp_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { earnRateMultiplier: 1.5, spendRateMultiplier: 0.8 } },
    ],
  },

  // ---------- MIRACLE LOG ----------
  {
    id: "feat_miracleLog",
    key: "miracleLog",
    name: "Miracle Log",
    description: null,
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      dailyLimit: { type: "number", label: "Daily Limit", default: 1 },
      isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: true },
    },
    planConfigs: [
      { id: "ml_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { dailyLimit: 1, isUpgradeFlagShow: true } },
      { id: "ml_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 1, isUpgradeFlagShow: true } },
      { id: "ml_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { dailyLimit: 3 } },
      { id: "ml_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 3 } },
    ],
  },

  {
  id: "feat_challenges",
  key: "challenges",
  name: "Challenges",
  description: "Create, join and manage challenges",
  isActive: true,
  allowedUserTypes: ["ENTHUSIAST", "COACH"],
  actions: {
    join: ["ENTHUSIAST", "COACH"],
    create: ["COACH", "ENTHUSIAST"],
    issueCertificate: ["COACH"],
    groupChat: ["ENTHUSIAST", "COACH"],
  },
  configSchema: {
    createLimit: { type: "number", label: "Create Limit", default: 3 },
    canCreatePaidChallenge: { type: "boolean", label: "Paid Challenge", default: false },
    commissionPercent: { type: "number", label: "Commission %", default: 25 },
    canIssueCertificate: { type: "boolean", label: "Issue Certificate", default: false },
    groupChatLimit: { type: "number", label: "Group Chat Limit", default: -1 },
    joinLimit: { type: "number", label: "Join Limit", default: -1 },
    limitType: { type: "select", label: "Limit Type", options: ["MONTHLY","YEARLY","LIFETIME"], default: "MONTHLY" },
    isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: false },
  },
  planConfigs: [
    { id: "ch_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { createLimit: 10, canCreatePaidChallenge: false, commissionPercent: 25, canIssueCertificate: false, groupChatLimit: -1, joinLimit: -1, limitType: "LIFETIME", isUpgradeFlagShow: false } },
    { id: "ch_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { createLimit: 3, groupChatLimit: -1, joinLimit: -1, limitType: "MONTHLY", isUpgradeFlagShow: true } },
    { id: "ch_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { createLimit: 10, canCreatePaidChallenge: true, commissionPercent: 5, canIssueCertificate: true, groupChatLimit: -1, joinLimit: -1, limitType: "MONTHLY" } },
    { id: "ch_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { createLimit: 10, canCreatePaidChallenge: false, canIssueCertificate: false, groupChatLimit: 1, joinLimit: -1, limitType: "MONTHLY" } },
  ],
},
{
  id: "feat_accountabilityHub",
  key: "accountabilityHub",
  name: "Accountability Hub",
  description: "Create accountability groups",
  isActive: true,
  allowedUserTypes: ["ENTHUSIAST", "COACH"],
  actions: {
    join: ["ENTHUSIAST", "COACH"],
    create: ["COACH"],
  },
  configSchema: {
    createLimit: { type: "number", label: "Create Limit", default: 1 },
    limitType: { type: "select", label: "Limit Type", options: ["MONTHLY","YEARLY","LIFETIME"], default: "MONTHLY" },
  },
  planConfigs: [
    { id: "ah_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { createLimit: 1, limitType: "MONTHLY" } },
    { id: "ah_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { createLimit: 1, limitType: "MONTHLY" } },
  ],
},
{
  id: "feat_miniMasteryPrograms",
  key: "miniMasteryPrograms",
  name: "Mini Mastery Programs",
  description: "Create and sell programs",
  isActive: true,
  allowedUserTypes: ["COACH"],
  actions: {
    create: ["COACH"],
    publishPaidProgram: ["COACH"],
  },
  configSchema: {
    createLimit: { type: "number", label: "Create Limit (-1 unlimited)", default: 1 },
    commissionPercent: { type: "number", label: "Commission %", default: 20 },
  },
  planConfigs: [
    { id: "mmp_f", membership: "FREE", userType: "COACH", isActive: true, config: { createLimit: 1, commissionPercent: 20 } },
    { id: "mmp_p", membership: "PAID", userType: "COACH", isActive: true, config: { createLimit: -1, commissionPercent: 10 } },
  ],
},

  // ---------- ONE % START ----------
  {
    id: "feat_onePercentStart",
    key: "onePercentStart",
    name: "1% Start",
    description: null,
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      dailyLimit: { type: "number", label: "Daily Limit", default: 1 },
      isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: true },
    },
    planConfigs: [
      { id: "ops_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { dailyLimit: 1, isUpgradeFlagShow: true } },
      { id: "ops_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 1, isUpgradeFlagShow: true } },
      { id: "ops_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { dailyLimit: 3 } },
      { id: "ops_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 3 } },
    ],
  },

  // ---------- PROGRESS VAULT ----------
  {
    id: "feat_onePercentProgressVault",
    key: "onePercentProgressVault",
    name: "Progress Vault",
    description: null,
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      dailyLimit: { type: "number", label: "Daily Limit", default: 1 },
      isUpgradeFlagShow: { type: "boolean", label: "Upgrade Flag", default: true },
    },
    planConfigs: [
      { id: "pv_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { dailyLimit: 1, isUpgradeFlagShow: true } },
      { id: "pv_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 1, isUpgradeFlagShow: true } },
      { id: "pv_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { dailyLimit: 3 } },
      { id: "pv_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 3 } },
    ],
  },

  // ---------- DAILY BLOOMS ----------
  {
    id: "feat_dailyBlooms",
    key: "dailyBlooms",
    name: "Daily Blooms",
    description: null,
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      dailyLimit: { type: "number", label: "Daily Limit (-1 unlimited)", default: 3 },
    },
    planConfigs: [
      { id: "db_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { dailyLimit: 3 } },
      { id: "db_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 3 } },
      { id: "db_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { dailyLimit: -1 } },
      { id: "db_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: -1 } },
    ],
  },

  // ---------- REMINDERS ----------
  {
    id: "feat_reminders",
    key: "reminders",
    name: "Reminders",
    description: null,
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      dailyLimit: { type: "number", label: "Daily Limit (-1 unlimited)", default: 1 },
    },
    planConfigs: [
      { id: "rm_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { dailyLimit: 1 } },
      { id: "rm_f_e", membership: "FREE", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: 1 } },
      { id: "rm_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { dailyLimit: -1 } },
      { id: "rm_p_e", membership: "PAID", userType: "ENTHUSIAST", isActive: true, config: { dailyLimit: -1 } },
    ],
  },

  // ---------- MAGIC BOX ----------
  {
    id: "feat_magicBox",
    key: "magicBox",
    name: "Magic Box",
    description: null,
    isActive: true,
    allowedUserTypes: ["ENTHUSIAST", "COACH"],
    actions: null,
    configSchema: {
      dailyOpens: { type: "number", label: "Daily Opens", default: 1 },
      bonusEligible: { type: "boolean", label: "Bonus Eligible", default: false },
      bonusMultiplier: { type: "number", label: "Bonus Multiplier", default: 1 },
      minJp: { type: "number", label: "Min JP", default: 100 },
      maxJp: { type: "number", label: "Max JP", default: 500 },
    },
    planConfigs: [
      { id: "mb_f_c", membership: "FREE", userType: "COACH", isActive: true, config: { dailyOpens: 1, bonusEligible: false, bonusMultiplier: 1, minJp: 100, maxJp: 500 } },
      { id: "mb_p_c", membership: "PAID", userType: "COACH", isActive: true, config: { dailyOpens: 3, bonusEligible: true, bonusMultiplier: 1.5, minJp: 100, maxJp: 600 } },
    ],
  },

  // ---------- BUDDY LENS ----------
  {
    id: "feat_buddyLens",
    key: "buddyLens",
    name: "Buddy Lens",
    description: null,
    isActive: true,
    allowedUserTypes: ["COACH"],
    actions: null,
    configSchema: {
      requestLimit: { type: "number", label: "Request Limit", default: 1 },
      earnJPPerReview: { type: "number", label: "Earn JP", default: 1000 },
    },
    planConfigs: [
      { id: "bl_f", membership: "FREE", userType: "COACH", isActive: true, config: { requestLimit: 1, earnJPPerReview: 1000 } },
      { id: "bl_p", membership: "PAID", userType: "COACH", isActive: true, config: { requestLimit: 6, earnJPPerReview: 1500 } },
    ],
  },

  // ---------- DISCOVERY CALLS ----------
  {
    id: "feat_discoveryCalls",
    key: "discoveryCalls",
    name: "Discovery Calls",
    description: null,
    isActive: true,
    allowedUserTypes: ["COACH"],
    actions: null,
    configSchema: {
      activeListings: { type: "number", label: "Active Listings", default: 1 },
    },
    planConfigs: [
      { id: "dc_f", membership: "FREE", userType: "COACH", isActive: true, config: { activeListings: 1 } },
      { id: "dc_p", membership: "PAID", userType: "COACH", isActive: true, config: { activeListings: -1 } },
    ],
  },

  // ---------- LIVE WEBINARS ----------
  {
    id: "feat_liveWebinars",
    key: "liveWebinars",
    name: "Live Webinars",
    description: null,
    isActive: true,
    allowedUserTypes: ["COACH"],
    actions: null,
    configSchema: {
      activeListings: { type: "number", label: "Active Listings", default: 1 },
    },
    planConfigs: [
      { id: "lw_f", membership: "FREE", userType: "COACH", isActive: true, config: { activeListings: 1 } },
      { id: "lw_p", membership: "PAID", userType: "COACH", isActive: true, config: { activeListings: -1 } },
    ],
  },

  // ---------- PROSPERITY DROPS ----------
  {
    id: "feat_prosperityDrops",
    key: "prosperityDrops",
    name: "Prosperity Drops",
    description: null,
    isActive: true,
    allowedUserTypes: ["COACH"],
    actions: null,
    configSchema: {
      eligible: { type: "boolean", label: "Eligible", default: false },
      priorityWeight: { type: "number", label: "Priority", default: 0 },
    },
    planConfigs: [
      { id: "pd_f", membership: "FREE", userType: "COACH", isActive: true, config: { eligible: false, priorityWeight: 0 } },
      { id: "pd_p", membership: "PAID", userType: "COACH", isActive: true, config: { eligible: true, priorityWeight: 1 } },
    ],
  },
];

// ─────────────────────────────────────────────
// SMART JSON EDITOR
// ─────────────────────────────────────────────

/** Pairs that get auto-closed when opened */
const AUTO_CLOSE_PAIRS: Record<string, string> = {
    "{": "}",
    "[": "]",
    '"': '"',
};

/** Chars we skip over instead of inserting when already present */
const SKIP_CHARS = new Set(["}", "]", '"']);

/** Returns leading whitespace of the line containing `pos` */
function getIndent(text: string, pos: number): string {
    const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
    const match = text.slice(lineStart, pos).match(/^(\s*)/);
    return match ? match[1] : "";
}

interface JsonEditorProps {
    value: object | null;
    onChange: (parsed: object) => void;
    label?: string;
    description?: string;
    minHeight?: string;
    schemaHint?: string;
}

function JsonEditor({ value, onChange, label, description, minHeight = "260px", schemaHint }: JsonEditorProps) {
    const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2) ?? "{}");
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState({ line: 1, col: 1 });
    const [showHint, setShowHint] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const prevValueRef = useRef<string>("");

    // Sync external → editor only when the serialized value actually changes
    useEffect(() => {
        const serialized = JSON.stringify(value, null, 2) ?? "{}";
        if (serialized !== prevValueRef.current) {
            prevValueRef.current = serialized;
            setRaw(serialized);
            setError(null);
        }
    }, [value]);

    const lineCount = raw.split("\n").length;

    /** Try to parse + propagate. On failure just store error. */
    const tryParse = useCallback((text: string) => {
        try {
            const parsed = JSON.parse(text);
            setError(null);
            onChange(parsed);
        } catch (err: any) {
            setError(err.message ?? "Invalid JSON");
        }
    }, [onChange]);

    /** Apply a text mutation: update state, move cursor, parse. */
    const applyMutation = useCallback((
        ta: HTMLTextAreaElement,
        next: string,
        newCursorPos: number
    ) => {
        setRaw(next);
        tryParse(next);
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = newCursorPos;
        });
    }, [tryParse]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;
        const { selectionStart: start, selectionEnd: end } = ta;
        const text = raw;

        // ── Tab → 2 spaces ───────────────────────────────────────────
        if (e.key === "Tab") {
            e.preventDefault();
            const next = text.slice(0, start) + "  " + text.slice(end);
            applyMutation(ta, next, start + 2);
            return;
        }

        // ── Enter → smart indent ──────────────────────────────────────
        if (e.key === "Enter") {
            e.preventDefault();
            const before = text.slice(0, start);
            const after = text.slice(end);
            const indent = getIndent(text, start);
            const lastBefore = before.trimEnd().slice(-1);
            const firstAfter = after.trimStart()[0];

            // Between { } or [ ] → expand with extra indent level
            if (
                (lastBefore === "{" && firstAfter === "}") ||
                (lastBefore === "[" && firstAfter === "]")
            ) {
                const inner = indent + "  ";
                const insertion = "\n" + inner + "\n" + indent;
                const next = before + insertion + after;
                applyMutation(ta, next, start + inner.length + 1);
                return;
            }

            // Normal enter → preserve current indent
            const insertion = "\n" + indent;
            applyMutation(ta, before + insertion + after, start + insertion.length);
            return;
        }

        // ── Backspace → delete auto-closed pair ──────────────────────
        if (e.key === "Backspace" && start === end && start > 0) {
            const charBefore = text[start - 1];
            const charAfter = text[start];
            const closeOf = AUTO_CLOSE_PAIRS[charBefore];
            // Delete both chars if they form a pair (but not "" pair — too aggressive)
            if (closeOf && charAfter === closeOf && charBefore !== '"') {
                e.preventDefault();
                const next = text.slice(0, start - 1) + text.slice(start + 1);
                applyMutation(ta, next, start - 1);
                return;
            }
        }

        // ── Quote handling ────────────────────────────────────────────
        if (e.key === '"') {
            const before = text.slice(0, start);
            const isInsideString = (before.match(/"/g)?.length ?? 0) % 2 === 1;

            // Skip over existing closing quote
            if (start === end && text[start] === '"') {
                e.preventDefault();
                requestAnimationFrame(() => {
                    ta.selectionStart = ta.selectionEnd = start + 1;
                });
                return;
            }

            // If already inside string → just insert quote normally
            if (isInsideString) {
                return;
            }

            // Wrap selection
            if (start !== end) {
                e.preventDefault();
                const selected = text.slice(start, end);
                const next = text.slice(0, start) + '"' + selected + '"' + text.slice(end);
                applyMutation(ta, next, end + 2);
                return;
            }

            // Auto close
            e.preventDefault();
            const next = text.slice(0, start) + '""' + text.slice(end);
            applyMutation(ta, next, start + 1);
            return;
        }

        // ── Auto-close { and [ ────────────────────────────────────────
        if (e.key === "{" || e.key === "[") {
            e.preventDefault();
            const close = AUTO_CLOSE_PAIRS[e.key];
            // Wrap selection if any
            if (start !== end) {
                const selected = text.slice(start, end);
                const next = text.slice(0, start) + e.key + selected + close + text.slice(end);
                applyMutation(ta, next, end + 2);
                return;
            }
            const next = text.slice(0, start) + e.key + close + text.slice(end);
            applyMutation(ta, next, start + 1);
            return;
        }

        // ── Skip over closing } and ] ─────────────────────────────────
        if (SKIP_CHARS.has(e.key) && text[start] === e.key) {
            e.preventDefault();
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
            return;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const next = e.target.value;
        setRaw(next);
        tryParse(next);
    };

    const updateCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;
        const before = raw.substring(0, ta.selectionStart);
        const lines = before.split("\n");
        setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 });
    };

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(raw);
            const formatted = JSON.stringify(parsed, null, 2);
            setRaw(formatted);
            setError(null);
            onChange(parsed);
        } catch { }
    };

    return (
        <div className="space-y-2">
            {/* Label row */}
            {(label || description) && (
                <div className="flex items-center justify-between">
                    <div>
                        {label && <Label className="text-sm font-medium">{label}</Label>}
                        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                        {schemaHint && (
                            <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 h-7"
                                onClick={() => setShowHint(h => !h)}>
                                <WrapText className="w-3 h-3" /> {showHint ? "Hide Hint" : "Show Hint"}
                            </Button>
                        )}
                        <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={formatJson}>
                            <Braces className="w-3 h-3" /> Format
                        </Button>
                    </div>
                </div>
            )}

            {/* Editor shell */}
            <div className={`rounded-xl overflow-hidden  border-2 transition-colors ${error ? "border-red-400/60" : "border-border focus-within:border-primary/40"} shadow-md`}
                style={{ background: "black " }}>

                {/* Mac-style tab bar */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5"
                    style={{ background: "#16213e" }}>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                        <span className="ml-3 text-[10px]  select-none" style={{ color: "white" }}>
                            {label ?? "editor.json"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {error
                            ? <XCircle className="w-3 h-3 text-red-400" />
                            : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        <span className={`text-[10px] font-mono ${error ? "text-red-400" : "text-emerald-400"}`}>
                            {error ? "error" : "valid"}
                        </span>
                    </div>
                </div>

                {/* Gutter + textarea */}
                <div className="flex" style={{ minHeight }}>
                    {/* Line numbers */}
                    <div
                        ref={lineNumbersRef}
                        className="select-none overflow-hidden flex-shrink-0 text-right pr-3 pl-3 pt-3  text-[11px]"
                        style={{ width: "3.2rem", color: "white", userSelect: "none", lineHeight: "1.65rem", background: "#1a1a2e" }}
                        aria-hidden
                    >
                        {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i + 1} style={{ lineHeight: "1.65rem" }}>{i + 1}</div>
                        ))}
                    </div>

                    {/* Thin separator */}
                    <div className="w-px flex-shrink-0" style={{ background: "#2a2a4a" }} />

                    {/* Editable area */}
                    <textarea
                        ref={textareaRef}
                        value={raw}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        onClick={updateCursor}
                        onKeyUp={updateCursor}
                        spellCheck={false}
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="flex-1 resize-none bg-transparent font-mono text-[12.5px] pt-3 pr-4 pb-3 pl-3 outline-none border-none focus:ring-0 overflow-auto"
                        style={{
                            minHeight,
                            tabSize: 2,
                            lineHeight: "1.65rem",
                            color: "#cdd6f4",
                            caretColor: "#89b4fa",
                        }}
                    />
                </div>

                {/* Error bar */}
                {error && (
                    <div className="flex items-start gap-2 px-3 py-2 border-t border-red-500/20"
                        style={{ background: "rgba(239,68,68,0.08)" }}>
                        <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] text-red-300 font-mono break-all">{error}</span>
                    </div>
                )}

                {/* Status bar */}
                <div className="flex items-center justify-between px-3 py-1 text-[9px] font-mono"
                    style={{ background: "#0f3460", color: "rgba(255,255,255,0.45)" }}>
                    <div className="flex items-center gap-3">
                        <span style={{ color: "rgba(255,255,255,0.75)" }}>Ln {cursor.line}, Col {cursor.col}</span>
                        <span>JSON</span>
                        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                        <span>Auto-close: {"{ [ \""}</span>
                    </div>
                    <span>{lineCount} lines</span>
                </div>
            </div>

            {/* Collapsible schema hint */}
            {showHint && schemaHint && (
                <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                    <p className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">{schemaHint}</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────
interface PageHeaderProps { onAddNew: () => void; }
function PageHeader({ onAddNew }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Feature Control</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage global flags, access rules, and plan limits.</p>
            </div>
            <Button onClick={onAddNew} className="w-full sm:w-auto gap-2">
                <Plus className="h-4 w-4" /> Add Feature
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────
interface SearchBarProps { value: string; onChange: (v: string) => void; }
function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <Card>
            <CardContent className="p-3 sm:p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search features by name or key..." className="pl-9 bg-muted/50"
                        value={value} onChange={(e) => onChange(e.target.value)} />
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
// FEATURE TABLE
// ─────────────────────────────────────────────
interface FeatureTableProps { features: Feature[]; onEdit: (f: Feature) => void; onToggle: (id: string) => void; }
function FeatureTable({ features, onEdit, onToggle }: FeatureTableProps) {
    return (
        <Card className="overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
                <Table className="w-full whitespace-nowrap sm:whitespace-normal">
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Feature Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Key</TableHead>
                            <TableHead>Allowed Users</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No features found.</TableCell>
                            </TableRow>
                        ) : features.map(f => (
                            <FeatureTableRow key={f.id} feature={f} onEdit={onEdit} onToggle={onToggle} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

interface FeatureTableRowProps { feature: Feature; onEdit: (f: Feature) => void; onToggle: (id: string) => void; }
function FeatureTableRow({ feature, onEdit, onToggle }: FeatureTableRowProps) {
    return (
        <TableRow className="hover:bg-muted/30">
            <TableCell className="font-medium">
                <div className="flex flex-col">
                    <span>{feature.name}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline-block truncate max-w-[200px]">{feature.description}</span>
                    <code className="text-[10px] text-muted-foreground sm:hidden mt-1">{feature.key}</code>
                </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
                <code className="text-xs bg-muted px-2 py-1 rounded border">{feature.key}</code>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[150px] sm:max-w-none">
                    {feature.allowedUserTypes.map(type => (
                        <Badge key={type} variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0">
                            {type.substring(0, 4)}<span className="hidden sm:inline">{type.substring(4)}</span>
                        </Badge>
                    ))}
                </div>
            </TableCell>
            <TableCell>
                <Switch checked={feature.isActive} onCheckedChange={() => onToggle(feature.id)} />
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(feature)}>
                    <Edit2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

// ─────────────────────────────────────────────
// GENERAL TAB
// ─────────────────────────────────────────────
interface GeneralTabProps { feature: Feature; onChange: (f: Feature) => void; }
function GeneralTab({ feature, onChange }: GeneralTabProps) {
    return (
        <Card>
            <CardHeader className="p-4 sm:p-6 pb-2"><CardTitle className="text-lg">Core Details</CardTitle></CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input value={feature.name} onChange={(e) => onChange({ ...feature, name: e.target.value })} placeholder="e.g. Magic Box" />
                    </div>
                    <div className="space-y-2">
                        <Label>Feature Key (Code)</Label>
                        <Input value={feature.key} onChange={(e) => onChange({ ...feature, key: e.target.value })} placeholder="e.g. magicBox" className="font-mono text-sm" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={feature.description || ""} onChange={(e) => onChange({ ...feature, description: e.target.value })} rows={3} />
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
// ACCESS TAB
// ─────────────────────────────────────────────
interface AccessTabProps { feature: Feature; onChange: (f: Feature) => void; }
function AccessTab({ feature, onChange }: AccessTabProps) {
    const toggleUserType = (type: FeatureUserType, checked: boolean) => {
        const newTypes = checked
            ? [...feature.allowedUserTypes, type]
            : feature.allowedUserTypes.filter(t => t !== type);
        onChange({ ...feature, allowedUserTypes: newTypes });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="text-lg">Allowed User Types</CardTitle>
                    <CardDescription className="text-xs">Who can see this feature at all?</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row gap-3">
                    {(["COACH", "ENTHUSIAST", "SOLOPRENEUR"] as FeatureUserType[]).map(type => (
                        <div key={type} className="flex items-center justify-between sm:justify-start space-x-3 bg-background p-3 rounded-lg border w-full sm:w-auto shadow-sm">
                            <Label className="cursor-pointer flex-1">{type}</Label>
                            <Switch checked={feature.allowedUserTypes.includes(type)} onCheckedChange={(c) => toggleUserType(type, c)} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="text-lg">Granular Actions</CardTitle>
                    <CardDescription className="text-xs">JSON mapping of specific actions to user types.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <JsonEditor
                        value={feature.actions ?? {}}
                        onChange={(parsed) => onChange({ ...feature, actions: parsed as Record<string, FeatureUserType[]> })}
                        label="actions.json"
                        minHeight="160px"
                        schemaHint={`// Example:\n{\n  "join": ["ENTHUSIAST", "COACH"],\n  "create": ["COACH"],\n  "issueCertificate": ["COACH"]\n}`}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

// ─────────────────────────────────────────────
// SCHEMA TAB
// ─────────────────────────────────────────────
const SCHEMA_HINT = `// Each key becomes a form field in the Plan Limits tab.
{
  "dailyLimit": {
    "type": "number",       // "number" | "boolean" | "string" | "select"
    "label": "Daily Limit",
    "default": 1
  },
  "limitType": {
    "type": "select",
    "label": "Limit Type",
    "options": ["MONTHLY", "YEARLY", "LIFETIME"],
    "default": "MONTHLY"
  },
  "isActive": {
    "type": "boolean",
    "label": "Is Active",
    "default": true
  }
}`;

interface SchemaTabProps { feature: Feature; onChange: (f: Feature) => void; }
function SchemaTab({ feature, onChange }: SchemaTabProps) {
    return (
        <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Configuration Schema
                </CardTitle>
                <CardDescription className="text-xs">
                    Define dynamic limit fields. They appear as inputs in the Plan Limits tab.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
                <JsonEditor
                    value={feature.configSchema ?? {}}
                    onChange={(parsed) => onChange({ ...feature, configSchema: parsed as Record<string, ConfigSchemaField> })}
                    label="configSchema.json"
                    minHeight="340px"
                    schemaHint={SCHEMA_HINT}
                />
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
// PLAN LIMITS SIDEBAR
// ─────────────────────────────────────────────
interface PlanLimitsSidebarProps {
    feature: Feature;
    selectedMembership: MembershipType;
    selectedUser: FeatureUserType;
    onMembershipChange: (m: MembershipType) => void;
    onUserChange: (u: FeatureUserType) => void;
}
function PlanLimitsSidebar({ feature, selectedMembership, selectedUser, onMembershipChange, onUserChange }: PlanLimitsSidebarProps) {
    return (
        <div className="space-y-4 bg-background p-4 rounded-lg border shadow-sm">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Membership</Label>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0">
                    {(["FREE", "PAID"] as MembershipType[]).map(plan => (
                        <Button key={plan} variant={selectedMembership === plan ? "default" : "outline"}
                            className="flex-1 md:justify-start text-xs sm:text-sm whitespace-nowrap"
                            onClick={() => onMembershipChange(plan)}>{plan}</Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2 pt-2 md:pt-4 border-t border-dashed">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">User Type</Label>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0">
                    {feature.allowedUserTypes.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-3 text-center border rounded-lg border-dashed bg-muted/30">
                            Enable in Access tab.
                        </div>
                    ) : feature.allowedUserTypes.map(type => (
                        <Button key={type} variant={selectedUser === type ? "default" : "outline"}
                            className="flex-1 md:justify-start text-xs sm:text-sm whitespace-nowrap"
                            onClick={() => onUserChange(type)}>
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-50" /> {type}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// PLAN CONFIG FIELD
// ─────────────────────────────────────────────
interface PlanConfigFieldProps { fieldKey: string; field: ConfigSchemaField; value: any; onChange: (key: string, value: any) => void; }
function PlanConfigField({ fieldKey, field, value, onChange }: PlanConfigFieldProps) {
    return (
        <div className="space-y-2.5 bg-background p-4 rounded-xl border shadow-sm transition-all focus-within:border-primary/50">
            <Label className="flex justify-between items-center text-sm">
                {field.label}
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{fieldKey}</span>
            </Label>
            {field.type === "number" && (
                <Input type="number" className="bg-muted/30" value={value}
                    onChange={(e) => onChange(fieldKey, parseFloat(e.target.value) || 0)} />
            )}
            {field.type === "string" && (
                <Input value={value || ""} className="bg-muted/30" onChange={(e) => onChange(fieldKey, e.target.value)} />
            )}
            {field.type === "boolean" && (
                <div className="pt-1"><Switch checked={!!value} onCheckedChange={(c) => onChange(fieldKey, c)} /></div>
            )}
            {field.type === "select" && field.options && (
                <Select value={value} onValueChange={(v) => onChange(fieldKey, v)}>
                    <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// PLAN CONFIG FORM
// ─────────────────────────────────────────────
interface PlanConfigFormProps {
    feature: Feature; selectedMembership: MembershipType; selectedUser: FeatureUserType;
    onFeatureChange: (f: Feature) => void;
}
function PlanConfigForm({ feature, selectedMembership, selectedUser, onFeatureChange }: PlanConfigFormProps) {
    const getOrCreateConfig = useCallback((): FeaturePlanConfig => {
        const existing = feature.planConfigs.find(pc => pc.membership === selectedMembership && pc.userType === selectedUser);
        if (existing) return existing;
        const newConfig: FeaturePlanConfig = {
            id: `pc_new_${Date.now()}`, membership: selectedMembership, userType: selectedUser, isActive: true, config: {}
        };
        if (feature.configSchema) {
            Object.entries(feature.configSchema).forEach(([key, field]) => {
                newConfig.config[key] = field.default !== undefined ? field.default : (field.type === "number" ? 0 : "");
            });
        }
        onFeatureChange({ ...feature, planConfigs: [...feature.planConfigs, newConfig] });
        return newConfig;
    }, [feature, selectedMembership, selectedUser]);

    const currentConfig = getOrCreateConfig();

    const toggleActive = (v: boolean) => {
        const updated = feature.planConfigs.map(pc => pc.id === currentConfig.id ? { ...pc, isActive: v } : pc);
        onFeatureChange({ ...feature, planConfigs: updated });
    };

    const updateValue = (key: string, value: any) => {
        const updated = feature.planConfigs.map(pc =>
            pc.id === currentConfig.id ? { ...pc, config: { ...pc.config, [key]: value } } : pc
        );
        onFeatureChange({ ...feature, planConfigs: updated });
    };

    const hasSchema = feature.configSchema && Object.keys(feature.configSchema).length > 0;

    return (
        <Card className="h-full border-t-4 transition-colors shadow-sm"
            style={{ borderTopColor: currentConfig?.isActive ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)" }}>
            <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between pb-4 border-b bg-muted/10">
                <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" /> {selectedMembership} / {selectedUser}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Adjust parameters for this tier.</CardDescription>
                </div>
                {currentConfig && (
                    <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border shadow-sm">
                        <Label className="text-[10px] sm:text-xs font-semibold">Active</Label>
                        <Switch checked={currentConfig.isActive} onCheckedChange={toggleActive} />
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                {!currentConfig?.isActive ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3 py-12">
                        <ShieldAlert className="h-10 w-10 opacity-20" />
                        <p className="text-sm">This tier is disabled.</p>
                    </div>
                ) : hasSchema ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {Object.entries(feature.configSchema!).map(([key, field]) => (
                            <PlanConfigField key={key} fieldKey={key} field={field}
                                value={currentConfig.config[key] ?? field.default} onChange={updateValue} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/10 text-sm">
                        No UI Schema defined yet. Add fields in the <strong>UI Schema</strong> tab.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
// PLAN LIMITS TAB
// ─────────────────────────────────────────────
interface PlanLimitsTabProps {
    feature: Feature; onChange: (f: Feature) => void;
    selectedMembership: MembershipType; selectedUser: FeatureUserType;
    onMembershipChange: (m: MembershipType) => void; onUserChange: (u: FeatureUserType) => void;
}
function PlanLimitsTab({ feature, onChange, selectedMembership, selectedUser, onMembershipChange, onUserChange }: PlanLimitsTabProps) {
    return (
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 h-full">
            <div className="col-span-12 md:col-span-3">
                <PlanLimitsSidebar feature={feature} selectedMembership={selectedMembership} selectedUser={selectedUser}
                    onMembershipChange={onMembershipChange} onUserChange={onUserChange} />
            </div>
            <div className="col-span-12 md:col-span-9">
                <PlanConfigForm feature={feature} selectedMembership={selectedMembership}
                    selectedUser={selectedUser} onFeatureChange={onChange} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// EDITOR MODAL
// ─────────────────────────────────────────────
interface FeatureEditorModalProps {
    open: boolean; feature: Feature | null;
    onClose: () => void; onSave: () => void; onChange: (f: Feature) => void;
}
function FeatureEditorModal({ open, feature, onClose, onSave, onChange }: FeatureEditorModalProps) {
    const [selectedMembership, setSelectedMembership] = useState<MembershipType>("FREE");
    const [selectedUser, setSelectedUser] = useState<FeatureUserType>("COACH");

    useEffect(() => {
        if (feature?.allowedUserTypes.length) setSelectedUser(feature.allowedUserTypes[0]);
    }, [feature?.id]);

    if (!feature) return null;
    const isNew = feature.id.startsWith("feat_new") || !feature.name;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-xl">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b shrink-0 bg-background z-10">
                    <div className="pr-6 sm:pr-0">
                        <DialogTitle className="text-xl sm:text-2xl">
                            {isNew ? "Create Feature" : `Edit: ${feature.name}`}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm hidden sm:block">
                            Configure core details, access rules, and dynamic limits for this feature.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-muted/10">
                    <Tabs defaultValue="general" className="w-full h-full flex flex-col">
                        <div className="w-full overflow-x-auto border-b bg-background px-2 sm:px-6 shrink-0">
                            <TabsList className="flex w-max min-w-full h-auto py-2 bg-transparent justify-start gap-2">
                                <TabsTrigger value="general" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Settings className="w-4 h-4 mr-2 hidden sm:block" /> General
                                </TabsTrigger>
                                <TabsTrigger value="access" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <ShieldAlert className="w-4 h-4 mr-2 hidden sm:block" /> Access
                                </TabsTrigger>
                                <TabsTrigger value="schema" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Box className="w-4 h-4 mr-2 hidden sm:block" /> UI Schema
                                </TabsTrigger>
                                <TabsTrigger value="configs" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Activity className="w-4 h-4 mr-2 hidden sm:block" /> Plan Limits
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 sm:p-6 flex-1">
                            <TabsContent value="general" className="m-0">
                                <GeneralTab feature={feature} onChange={onChange} />
                            </TabsContent>
                            <TabsContent value="access" className="m-0">
                                <AccessTab feature={feature} onChange={onChange} />
                            </TabsContent>
                            <TabsContent value="schema" className="m-0">
                                <SchemaTab feature={feature} onChange={onChange} />
                            </TabsContent>
                            <TabsContent value="configs" className="m-0 h-full">
                                <PlanLimitsTab feature={feature} onChange={onChange}
                                    selectedMembership={selectedMembership} selectedUser={selectedUser}
                                    onMembershipChange={setSelectedMembership} onUserChange={setSelectedUser} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t bg-background shrink-0 flex flex-col sm:flex-row gap-2 z-10">
                    <Button variant="outline" className="w-full sm:w-auto order-1 sm:order-none" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave} className="w-full sm:w-auto gap-2">
                        <Save className="w-4 h-4" /> Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────
// ROOT PAGE
// ─────────────────────────────────────────────
export default function AdminFeaturesPage() {
    const [features, setFeatures] = useState<Feature[]>(INITIAL_FEATURES);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const filteredFeatures = features.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEditClick = (feature: Feature) => {
        setEditingFeature(JSON.parse(JSON.stringify(feature)));
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingFeature({
            id: `feat_new_${Date.now()}`, key: "", name: "", description: "",
            isActive: false, allowedUserTypes: [], actions: {}, configSchema: {}, planConfigs: []
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!editingFeature) return;
        setFeatures(prev => {
            const exists = prev.find(f => f.id === editingFeature.id);
            if (exists) return prev.map(f => f.id === editingFeature.id ? editingFeature : f);
            return [...prev, editingFeature];
        });
        setIsDialogOpen(false);
        setEditingFeature(null);
    };

    const handleClose = () => { setIsDialogOpen(false); setEditingFeature(null); };

    const toggleFeatureActive = (id: string) => {
        setFeatures(prev => prev.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader onAddNew={handleAddNew} />
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FeatureTable features={filteredFeatures} onEdit={handleEditClick} onToggle={toggleFeatureActive} />
            <FeatureEditorModal open={isDialogOpen} feature={editingFeature}
                onClose={handleClose} onSave={handleSave} onChange={setEditingFeature} />
        </div>
    );
}