"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigSchemaField, SchemaTabProps } from "@/types/client/admin/feature-controls.types";
import { Code2 } from "lucide-react";
import JsonEditor from "../JsonEditor";
import { SCHEMA_HINT } from "@/utils/feature-controls.utils";

export default function SchemaTab({ feature, onChange, dbConfigSchema }: SchemaTabProps) {
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