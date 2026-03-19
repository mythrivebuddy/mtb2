"use client";
import { MembershipType, PlanLimitsTabProps } from "@/types/client/admin/feature-controls.types";
import PlanConfigForm from "../PlanConfigForm";
import { Badge } from "@/components/ui/badge";
import { getEffectiveUserTypes } from "@/utils/feature-controls.utils";


export default function PlanLimitsTab({ feature, onChange }: PlanLimitsTabProps) {
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