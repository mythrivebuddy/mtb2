"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { JsonEditorProps } from "@/types/client/admin/feature-controls.types";
import { AUTO_CLOSE_PAIRS, getIndent, SKIP_CHARS } from "@/utils/feature-controls.utils";
import { AlertCircle, Braces, CheckCircle2, WrapText, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";


type FeatureConfig = {
  canCreatePaidChallenge?: boolean;
  commissionPercent?: number;
};

type ParsedConfig = {
  coach?: FeatureConfig;
  enthusiast?: FeatureConfig;
} & FeatureConfig;
export default function JsonEditor({ value, onChange, label, description, minHeight = "260px", schemaHint, dbHint, onApplyHint }: JsonEditorProps) {
    const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2) ?? "{}");
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState({ line: 1, col: 1 });
    const [showHint, setShowHint] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const prevValueRef = useRef<string>("");

    

    useEffect(() => {
        const serialized = JSON.stringify(value, null, 2) ?? "{}";
        if (serialized !== prevValueRef.current) {
            prevValueRef.current = serialized;
            setRaw(serialized);
            setError(null);
        }
    }, [value]);

    const lineCount = raw.split("\n").length;

  const tryParse = useCallback((text: string) => {
    try {
        const parsed: unknown = JSON.parse(text);

        if (typeof parsed !== "object" || parsed === null) {
            throw new Error("Invalid JSON structure");
        }

        const data = parsed as ParsedConfig;

        // 🔑 BUSINESS RULE ENFORCEMENT
        const enforceRules = (obj: FeatureConfig) => {
            if (!obj?.canCreatePaidChallenge) {
                delete obj.commissionPercent;
            }
            return obj;
        };

        // Handle nested structure
        if (data.coach) data.coach = enforceRules(data.coach);
        if (data.enthusiast) data.enthusiast = enforceRules(data.enthusiast);

        // Handle flat structure
        if (!data.coach && !data.enthusiast) {
            enforceRules(data);
        }

        setError(null);
        onChange(data);
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