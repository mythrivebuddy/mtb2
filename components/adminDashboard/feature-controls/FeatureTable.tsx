"use client";

import { Card } from "@/components/ui/card";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { FeatureTableProps } from "@/types/client/admin/feature-controls.types";
import FeatureTableRow from "./FeatureTableRow";


export default function FeatureTable({ features, onEdit, onToggle }: FeatureTableProps) {
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