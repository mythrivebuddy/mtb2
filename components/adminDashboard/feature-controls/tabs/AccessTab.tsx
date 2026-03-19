"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AccessTabProps, FeatureUserType } from "@/types/client/admin/feature-controls.types";

import JsonEditor from "../JsonEditor";

export default function AccessTab({ feature, onChange }: AccessTabProps) {
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