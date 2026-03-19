"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GeneralTabProps } from "@/types/client/admin/feature-controls.types";

export default function GeneralTab({ feature, onChange }: GeneralTabProps) {
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