"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FeaturePlanConfig, JsonValue, PlanConfigFormProps } from "@/types/client/admin/feature-controls.types";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { useCallback } from "react";
import PlanConfigField from "./PlanConfigField";
import { getVisibleSchemaFields } from "@/utils/feature-controls.utils";

export default function PlanConfigForm({ feature, selectedMembership, selectedUser, onFeatureChange }: PlanConfigFormProps) {
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

    //  PATCH MISSING KEYS FROM SCHEMA
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