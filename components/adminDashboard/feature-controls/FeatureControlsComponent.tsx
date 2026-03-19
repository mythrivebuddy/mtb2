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
import { useMutation, UseMutationResult, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { FeatureSchema } from "@/schema/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type FeatureUserType = "COACH" | "ENTHUSIAST" | "SOLOPRENEUR";
export type MembershipType = "FREE" | "PAID";
type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[];

export interface ConfigSchemaField {
    type: "number" | "boolean" | "string" | "select";
    label: string;
    options?: string[];
    default?: JsonValue;
}

export interface FeaturePlanConfig {
    id: string;
    membership: MembershipType;
    userType: FeatureUserType;
    isActive: boolean;
    config: Record<string, JsonValue>;
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
type CreateFeatureInput = {
    key: string;
    name: string;
    description: string | null;
    configSchema: Record<string, ConfigSchemaField> | null;
    allowedUserTypes: FeatureUserType[];
    actions: Record<string, FeatureUserType[]> | null;
    isActive: boolean;

    planConfigs: {
        membership: MembershipType;
        userType: FeatureUserType;
        isActive: boolean;
        config: Record<string, JsonValue>;
    }[];
};



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
// Derives which userTypes should have a config card for a given membership.
// A userType is included if it's in allowedUserTypes AND either:
//   - no actions are defined (feature-level access only), OR
//   - it appears in at least one action value
function getEffectiveUserTypes(feature: Feature): FeatureUserType[] {
    if (!feature.actions || Object.keys(feature.actions).length === 0) {
        return feature.allowedUserTypes;
    }
    const actionUserTypes = new Set(Object.values(feature.actions).flat());
    return feature.allowedUserTypes.filter(t => actionUserTypes.has(t));
}

// Returns only the configSchema fields relevant to a given userType,
// based on which actions they have access to.
// Fields whose key matches an action name are filtered by that action's userTypes.
// Fields with no matching action are always shown (they're global config).
function getVisibleSchemaFields(
    feature: Feature,
    userType: FeatureUserType
): [string, ConfigSchemaField][] {
    if (!feature.configSchema) return [];
    const entries = Object.entries(feature.configSchema);
    if (!feature.actions || Object.keys(feature.actions).length === 0) return entries;

    return entries.filter(([key]) => {
        // Find an action whose name is contained in the field key (e.g. "createLimit" → "create")
        const matchingAction = Object.entries(feature.actions!).find(([actionName]) =>
            key.toLowerCase().startsWith(actionName.toLowerCase()) || key.toLowerCase().includes(actionName.toLowerCase())
        );
        // If no matching action found → always show (it's a global field)
        if (!matchingAction) return true;
        // Show only if userType has this action
        return matchingAction[1].includes(userType);
    });
}

interface JsonEditorProps {
    value: object | null;
    onChange: (parsed: object) => void;
    label?: string;
    description?: string;
    minHeight?: string;
    schemaHint?: string;
    dbHint?: object | null;           // ← add this
    onApplyHint?: (v: object) => void; // ← add this
}

function JsonEditor({ value, onChange, label, description, minHeight = "260px", schemaHint, dbHint, onApplyHint }: JsonEditorProps) {
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Invalid JSON");
            }
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
                        <span className={`text-[10px]  ${error ? "text-red-400" : "text-emerald-400"}`}>
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
                        className="flex-1 resize-none bg-transparent text-[12.5px] pt-3 pr-4 pb-3 pl-3 outline-none border-none focus:ring-0 overflow-auto"
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
                        <span className="text-[10px] text-red-300  break-all">{error}</span>
                    </div>
                )}

                {/* Status bar */}
                <div className="flex items-center justify-between px-3 py-1 text-[9px] "
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
            {showHint && (
                <div className="space-y-3">
                    {/* Generic schema hint (format guide) */}
                    {schemaHint && (
                        <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                            <p className="text-[10px] text-muted-foreground  leading-relaxed whitespace-pre-wrap">{schemaHint}</p>
                        </div>
                    )}

                    {/* DB seeder hint with Apply button */}
                    {dbHint && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-amber-500/20 bg-amber-500/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        DB Seeder Default
                                    </span>

                                </div>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (onApplyHint) onApplyHint(dbHint);
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                            <pre className="text-[10px] text-amber-700 dark:text-amber-300  leading-relaxed p-3 overflow-x-auto whitespace-pre">
                                {JSON.stringify(dbHint, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────
function PageHeader() {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Feature Control</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage global flags, access rules, and plan limits.</p>
            </div>
            {/* <Button onClick={onAddNew} className="w-full sm:w-auto gap-2">
                <Plus className="h-4 w-4" /> Add Feature
            </Button> */}
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
function getFeatureSummary(feature: Feature): string[] {
    if (!feature.configSchema || feature.planConfigs.length === 0) {
        return ["No limits"];
    }

    const summaries: string[] = [];

    for (const pc of feature.planConfigs) {
        if (!pc.isActive) continue;

        const labelParts: string[] = [];

        for (const [key, value] of Object.entries(pc.config)) {
            const schema = feature.configSchema[key];

            if (!schema) continue;

            // 🔥 smart formatting
            if (typeof value === "number") {
                if (value === -1) {
                    labelParts.push(`${schema.label}: Unlimited`);
                } else {
                    labelParts.push(`${schema.label}: ${value}`);
                }
            } else if (typeof value === "boolean") {
                labelParts.push(`${schema.label}: ${value ? "Yes" : "No"}`);
            } else {
                labelParts.push(`${schema.label}: ${value}`);
            }
        }

        if (labelParts.length > 0) {
            summaries.push(
                `${pc.membership} ${pc.userType} → ${labelParts.join(", ")}`
            );
        }
    }

    return summaries;
}
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
            <TableCell className="py-4">
                <div className="flex flex-col gap-1.5">
                    {/* Feature Name and Key */}
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base">{feature.name}</span>

                    </div>

                    {/* Description */}
                    {feature.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                            {feature.description}
                        </span>
                    )}

                    {/* NEW: Inline Capabilities Summary */}
                    <div className="mt-1 flex flex-col gap-1 border-l-2 border-primary/20 pl-3">
                        {getFeatureSummary(feature).map((line, i) => (
                            <div key={i} className="text-[10px] sm:text-xs text-muted-foreground/80 italic">
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border text-muted-foreground">
                    {feature.key}
                </code>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[120px]">
                    {feature.allowedUserTypes.map(type => (
                        <Badge key={type} variant="outline" className="text-[9px] px-1">
                            {type}
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
                        <Input value={feature.key} onChange={(e) => onChange({ ...feature, key: e.target.value })} placeholder="e.g. magicBox" className="text-sm" />
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
                        onChange={(parsed) => {
                            const newActions = parsed as Record<string, FeatureUserType[]>;
                            const activeUserTypes = new Set(Object.values(newActions).flat());
                            // Remove planConfigs for userTypes no longer in any action
                            const prunedPlanConfigs = feature.planConfigs.filter(pc =>
                                activeUserTypes.size === 0 || activeUserTypes.has(pc.userType)
                            );
                            onChange({ ...feature, actions: newActions, planConfigs: prunedPlanConfigs });
                        }}
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

interface SchemaTabProps { feature: Feature; onChange: (f: Feature) => void; dbConfigSchema?: object | null; }
function SchemaTab({ feature, onChange, dbConfigSchema }: SchemaTabProps) {
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
                    dbHint={dbConfigSchema ?? null}
                    onApplyHint={(v) => onChange({ ...feature, configSchema: v as Record<string, ConfigSchemaField> })}
                />
            </CardContent>
        </Card>
    );
}



// ─────────────────────────────────────────────
// PLAN CONFIG FIELD
// ─────────────────────────────────────────────
interface PlanConfigFieldProps { fieldKey: string; field: ConfigSchemaField; value: JsonValue; onChange: (key: string, value: JsonValue) => void; }
function PlanConfigField({ fieldKey, field, value, onChange }: PlanConfigFieldProps) {
    return (
        <div className="space-y-2.5 bg-background py-4 px-3 rounded-xl border shadow-sm transition-all focus-within:border-primary/50">

            <Label className="flex justify-between gap-4 items-center text-sm">
                {field.label}
                <span className="text-[9px] sm:text-[10px] text-muted-foreground  bg-muted px-1.5 py-0.5 rounded">{fieldKey}</span>
            </Label>
            {field.type === "number" && (
                <Input type="number" className="bg-muted/30"
                    value={
                        typeof value === "number"
                            ? value
                            : value === ""
                                ? ""
                                : typeof field.default === "number"
                                    ? field.default
                                    : ""
                    }
                    onChange={(e) => {
                        const val = e.target.value;

                        if (val === "") {
                            onChange(fieldKey, ""); // allow empty
                            return;
                        }

                        const num = Number(val);
                        if (!isNaN(num)) {
                            onChange(fieldKey, num);
                        }
                    }}
                />
            )}
            {field.type === "string" && (
                <Input value={typeof value === "string" ? value : ""} className="bg-muted/30" onChange={(e) => onChange(fieldKey, e.target.value)} />
            )}
            {field.type === "boolean" && (
                <div className="pt-1"><Switch checked={!!value} onCheckedChange={(c) => onChange(fieldKey, c)} /></div>
            )}
            {field.type === "select" && field.options && (
                <Select value={typeof value === "string" ? value : ""} onValueChange={(v) => onChange(fieldKey, v)}>
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

    // 🔥 PATCH MISSING KEYS FROM SCHEMA
    if (feature.configSchema) {
        const updatedConfig = { ...currentConfig.config };

        let changed = false;

        for (const [key, field] of Object.entries(feature.configSchema)) {
            if (updatedConfig[key] === undefined) {
                updatedConfig[key] =
                    field.default ??
                    (field.type === "number"
                        ? 0
                        : field.type === "boolean"
                            ? false
                            : "");

                changed = true;
            }
        }

        if (changed) {
            const updated = feature.planConfigs.map((pc) =>
                pc.id === currentConfig.id
                    ? { ...pc, config: updatedConfig }
                    : pc
            );

            onFeatureChange({ ...feature, planConfigs: updated });
        }
    }

    const toggleActive = (v: boolean) => {
        const updated = feature.planConfigs.map(pc => pc.id === currentConfig.id ? { ...pc, isActive: v } : pc);
        onFeatureChange({ ...feature, planConfigs: updated });
    };

    const updateValue = (key: string, value: JsonValue) => {
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
            <CardContent className="p-4 sm:p-2">
                {!currentConfig?.isActive ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3 py-12">
                        <ShieldAlert className="h-10 w-10 opacity-20" />
                        <p className="text-sm">This tier is disabled.</p>
                    </div>
                ) : hasSchema ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {getVisibleSchemaFields(feature, selectedUser).map(([key, field]) => (
                            <PlanConfigField key={key} fieldKey={key} field={field}
                                value={
                                    (currentConfig.config[key] ??
                                        field.default ??
                                        (field.type === "number" ? 0 : field.type === "boolean" ? false : "")
                                    ) as JsonValue
                                } onChange={updateValue} />
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
    feature: Feature;
    onChange: (f: Feature) => void;
}
function PlanLimitsTab({ feature, onChange }: PlanLimitsTabProps) {
    const memberships: MembershipType[] = ["FREE", "PAID"];
    const effectiveUserTypes = getEffectiveUserTypes(feature);

    return (
        <div className="space-y-6">
            {memberships.map(membership => (
                <div key={membership}>
                    <div className="flex items-center gap-3 mb-3">
                        <Badge variant={membership === "PAID" ? "default" : "outline"} className="text-xs px-2 py-0.5">
                            {membership}
                        </Badge>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {effectiveUserTypes.length === 0 ? (
                            <div className="text-xs text-muted-foreground p-4 border border-dashed rounded-lg col-span-2">
                                No user types enabled. Go to the Access tab first.
                            </div>
                        ) : effectiveUserTypes.map(userType => (
                            <PlanConfigForm
                                key={`${membership}-${userType}`}
                                feature={feature}
                                selectedMembership={membership}
                                selectedUser={userType}
                                onFeatureChange={onChange}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// EDITOR MODAL
// ─────────────────────────────────────────────
type CreateFeatureResponse = { success: boolean; data: Feature };
type UpdateFeatureResponse = { success: boolean; data: Feature };

type CreateFeatureMutation = UseMutationResult<
    CreateFeatureResponse,
    unknown,
    CreateFeatureInput
>;

type UpdateFeatureMutation = UseMutationResult<
    UpdateFeatureResponse,
    unknown,
    Feature
>;
interface FeatureEditorModalProps {
    open: boolean;
    feature: Feature | null;
    onClose: () => void;
    createMutation: CreateFeatureMutation;
    updateMutation: UpdateFeatureMutation;
    features: Feature[]; // ← add this
}

function FeatureEditorModal({ open, feature, onClose, createMutation, updateMutation, features }: FeatureEditorModalProps) {

    const form = useForm<z.infer<typeof FeatureSchema>>({
        resolver: zodResolver(FeatureSchema),
        defaultValues: feature ?? {
            key: "",
            name: "",
            description: "",
            allowedUserTypes: [],
            actions: null,
            configSchema: null,
            planConfigs: [],
            isActive: true,
        },
    });

    const [step, setStep] = useState<"general" | "access" | "schema" | "configs">("general");

    const stepOrder = ["general", "access", "schema", "configs"] as const;


    useEffect(() => {
        if (feature) {
            form.reset(feature);
        }
    }, [feature]);
    const isLoading =
        createMutation.isPending || updateMutation.isPending;

    const handleNextStep = async () => {
        let fields: (keyof z.infer<typeof FeatureSchema>)[] = [];

        if (step === "general") fields = ["key", "name"];
        if (step === "access") fields = ["allowedUserTypes"];
        if (step === "schema") fields = ["configSchema"];

        const valid = await form.trigger(fields);

        if (!valid) {
            toast.error("Please fix errors before continuing");
            return;
        }

        const nextIndex = stepOrder.indexOf(step) + 1;
        setStep(stepOrder[nextIndex]);
    };

    const handleSubmitFinal = form.handleSubmit(async (data) => {
        const isNew = feature?.id.startsWith("feat_new");

        try {
            if (isNew) {
                // ✅ CREATE → NO ID
                const createPayload: CreateFeatureInput = {
                    ...data,
                    description: data.description ?? null,
                    configSchema: data.configSchema ?? null,
                    actions: data.actions ?? null,
                    planConfigs: data.planConfigs.map(({ id, ...rest }) => rest),
                };

                await createMutation.mutateAsync(createPayload);

            } else {
                // ✅ UPDATE → KEEP ID
                const updatePayload: Feature = {
                    ...data,
                    id: feature!.id,
                    description: data.description ?? null,
                    configSchema: data.configSchema ?? null,
                    actions: data.actions ?? null,

                    // 🔥 IMPORTANT: keep id here
                    planConfigs: data.planConfigs.map((pc) => ({
                        ...pc,
                        id: pc.id ?? `pc_fallback_${Date.now()}`, // safety fallback
                    })),
                };

                await updateMutation.mutateAsync(updatePayload);
            }

            onClose();
        } catch (error: unknown) {
            // keep modal open
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Something went wrong");
            } else {
                toast.error("Unexpected error occurred");
            }
        }
    });


    // fallback to feature if RHF not ready
    const safeFeature = form.watch();
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
                    <Tabs value={step} className="w-full h-full flex flex-col">
                        <div className="w-full overflow-x-auto border-b bg-background px-2 sm:px-6 shrink-0">
                            <TabsList className="flex w-max min-w-full h-auto py-2 bg-transparent justify-start gap-2">
                                <TabsTrigger value="general" onClick={() => setStep("general")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Settings className="w-4 h-4 mr-2 hidden sm:block" /> General
                                </TabsTrigger>
                                <TabsTrigger value="access" onClick={() => setStep("access")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <ShieldAlert className="w-4 h-4 mr-2 hidden sm:block" /> Access
                                </TabsTrigger>
                                <TabsTrigger value="schema" onClick={() => setStep("schema")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Box className="w-4 h-4 mr-2 hidden sm:block" /> UI Schema
                                </TabsTrigger>
                                <TabsTrigger value="configs" onClick={() => setStep("configs")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Activity className="w-4 h-4 mr-2 hidden sm:block" /> Plan Limits
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 sm:p-6 flex-1">
                            <TabsContent value="general" className="m-0">
                                <GeneralTab feature={safeFeature as Feature}
                                    onChange={(updated) => {
                                        type FeatureForm = z.infer<typeof FeatureSchema>;

                                        (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                            .forEach(([key, value]) => {
                                                form.setValue(key, value);
                                            });
                                    }} />
                            </TabsContent>
                            <TabsContent value="access" className="m-0">
                                <AccessTab feature={safeFeature as Feature} onChange={(updated) => {
                                    type FeatureForm = z.infer<typeof FeatureSchema>;

                                    (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                        .forEach(([key, value]) => {
                                            form.setValue(key, value);
                                        });
                                }} />
                            </TabsContent>
                            <TabsContent value="schema" className="m-0">
                                <SchemaTab
                                    feature={safeFeature as Feature}
                                    dbConfigSchema={
                                        features.find(f => f.id === feature?.id)?.configSchema ?? null
                                    }
                                    onChange={(updated) => {
                                        type FeatureForm = z.infer<typeof FeatureSchema>;
                                        (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                            .forEach(([key, value]) => {
                                                form.setValue(key, value);
                                            });
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="configs" className="m-0 h-full">
                                <PlanLimitsTab feature={safeFeature as Feature} onChange={(updated) => {
                                    type FeatureForm = z.infer<typeof FeatureSchema>;
                                    (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                        .forEach(([key, value]) => {
                                            form.setValue(key, value);
                                        });
                                }} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t bg-background shrink-0 flex flex-col sm:flex-row gap-2 z-10">
                    <Button variant="outline" className="w-full sm:w-auto order-1 sm:order-none" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (step !== "configs") {
                                handleNextStep();
                            } else {
                                handleSubmitFinal();
                            }
                        }}
                        disabled={isLoading}
                        className="w-full sm:w-auto gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {step === "configs" ? "Save Feature" : "Next"}
                            </>
                        )}
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

    const [searchQuery, setSearchQuery] = useState("");
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: features = [], isLoading } = useQuery({
        queryKey: ["features"],
        queryFn: async () => {
            const res = await axios.get<{ success: boolean; data: Feature[] }>("/api/admin/feature-controls");
            return res.data.data;
        },
    });

    const filteredFeatures = features.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEditClick = (feature: Feature) => {
        setEditingFeature(JSON.parse(JSON.stringify(feature)));
        setIsDialogOpen(true);
    };

    // const handleAddNew = () => {

    //     setEditingFeature({
    //         id: `feat_new_${Date.now()}`,
    //         key: "",
    //         name: "",
    //         description: null,
    //         isActive: false,
    //         allowedUserTypes: [],
    //         actions: null,          
    //         configSchema: null,     
    //         planConfigs: []
    //     });
    //     setIsDialogOpen(true);
    // };
    const createFeatureMutation = useMutation({
        mutationFn: async (data: CreateFeatureInput) => {
            const res = await axios.post("/api/admin/feature-controls", data);
            return res.data;
        },

        onSuccess: () => {
            toast.success("Feature created successfully");
            queryClient.invalidateQueries({ queryKey: ["features"] });
        },
        onError: () => {
            toast.error("Failed to create feature");
        },
    });

    const updateFeatureMutation = useMutation({
        mutationFn: async (data: Feature) => {
            const res = await axios.put(`/api/admin/feature-controls/${data.id}`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Feature updated successfully");
            queryClient.invalidateQueries({ queryKey: ["features"] });
        },
        onError: () => {
            toast.error("Failed to update feature");
        },
    });


    const handleClose = () => { setIsDialogOpen(false); setEditingFeature(null); };

    const toggleFeatureActive = (id: string) => {
        const feature = features.find(f => f.id === id);
        if (!feature) return;

        updateFeatureMutation.mutate({
            ...feature,
            isActive: !feature.isActive,
        });
    };
    if (isLoading) {
        return <div className="p-6 flex items-center justify-center">Loading features...</div>;
    }
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FeatureTable features={filteredFeatures} onEdit={handleEditClick} onToggle={toggleFeatureActive} />
            <FeatureEditorModal
                open={isDialogOpen}
                feature={editingFeature}
                onClose={handleClose}
                createMutation={createFeatureMutation}
                updateMutation={updateFeatureMutation}
                features={features}   // ← add this
            />
        </div>
    );
}