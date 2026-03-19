"use client";
import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

import { FeatureTableRowProps } from "@/types/client/admin/feature-controls.types";
import { getFeatureSummary } from "@/utils/feature-controls.utils";
import { Edit2 } from "lucide-react";

export default function FeatureTableRow({ feature, onEdit, onToggle }: FeatureTableRowProps) {
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