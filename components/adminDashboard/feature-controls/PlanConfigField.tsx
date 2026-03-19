"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlanConfigFieldProps } from "@/types/client/admin/feature-controls.types";


export default function PlanConfigField({ fieldKey, field, value, onChange }: PlanConfigFieldProps) {
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