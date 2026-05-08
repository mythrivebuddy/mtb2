"use client";

import { Card } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { FeatureTableProps } from "@/types/client/admin/feature-controls.types";
import FeatureTableRow from "./FeatureTableRow";
import { useTableSort } from "@/hooks/use-table-sort";
import SortArrow from "@/components/common/SortArrow";

export default function FeatureTable({
  features,
  onEdit,
  onToggle,
}: FeatureTableProps) {
  const { sortedData, sortKey, direction, handleSort } = useTableSort(features);
  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="overflow-x-auto">
        <Table className="w-full whitespace-nowrap sm:whitespace-normal">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  Feature Name
                  <SortArrow
                    active={sortKey === "name"}
                    direction={direction}
                  />
                </div>
              </TableHead>

              <TableHead
                onClick={() => handleSort("key")}
                className="hidden sm:table-cell cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  Key
                  <SortArrow active={sortKey === "key"} direction={direction} />
                </div>
              </TableHead>

              <TableHead
                onClick={() => handleSort("allowedUserTypes")}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  Allowed Users
                  <SortArrow
                    active={sortKey === "allowedUserTypes"}
                    direction={direction}
                  />
                </div>
              </TableHead>

              <TableHead
                onClick={() => handleSort("isActive")}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortArrow
                    active={sortKey === "isActive"}
                    direction={direction}
                  />
                </div>
              </TableHead>

              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No features found.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((f) => (
                <FeatureTableRow
                  key={f.id}
                  feature={f}
                  onEdit={onEdit}
                  onToggle={onToggle}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
