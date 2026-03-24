"use client";

import { format } from "date-fns";
import { Tag, Users, MoreHorizontal, Pencil, Ban, CheckCircle2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coupon } from "@/types/client/coupons.types";




type Props = {
    coupons: Coupon[];
    isLoading: boolean;
    onEdit: (coupon: Coupon) => void;
    onDelete?: (id: string) => void;
};

export default function CouponTable({ coupons, isLoading, onEdit, onDelete }: Props) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                            <div className="flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading data...
                            </div>
                        </TableCell>
                    </TableRow>
                ) : coupons.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                            No coupons found. Create one to get started.
                        </TableCell>
                    </TableRow>
                ) : (
                    coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                            <TableCell className="">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    {coupon.couponCode}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium capitalize">
                                        {coupon.type.replace("_", " ").toLowerCase()}
                                    </span>
                                    {coupon.autoApply && (
                                        <span className="text-xs text-purple-600 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Auto
                                        </span>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell>
                                <Badge variant="outline">{coupon.scope}</Badge>
                            </TableCell>

                            <TableCell>
                                <Badge
                                    variant={
                                        coupon.status === "ACTIVE"
                                            ? "default"
                                            : coupon.status === "EXPIRED"
                                                ? "secondary"
                                                : "destructive"
                                    }
                                >
                                    {coupon.status}
                                </Badge>
                            </TableCell>

                            <TableCell>
                                {coupon.type === "FULL_DISCOUNT" && <span>100%</span>}
                                {coupon.type === "PERCENTAGE" && coupon.discountPercentage &&
                                    `${coupon.discountPercentage}%`}
                                {coupon.type === "FIXED" && (
                                    <div className="flex flex-col">
                                        {coupon.discountAmountUSD && `USD $${coupon.discountAmountUSD}`}{" "}
                                        {coupon.discountAmountINR && `INR ₹${coupon.discountAmountINR}`}
                                        {coupon?.discountAmountGP && `GP ${coupon?.discountAmountGP}`}
                                    </div>
                                )}
                                {coupon.type === "FREE_DURATION" && coupon.freeDays &&
                                    `${coupon.freeDays} Days`}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                                {coupon.startDate && format(new Date(coupon.startDate), "MMM d, yyyy")}
                                <br />
                                {coupon.endDate && format(new Date(coupon.endDate), "MMM d, yyyy")}
                            </TableCell>

                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{coupon._count?.redemptions ?? 0}</span>
                                    <span className="text-muted-foreground text-xs">
                                        / {coupon.maxGlobalUses ?? "∞"}
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onEdit(coupon)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        {onDelete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(coupon.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Ban className="mr-2 h-4 w-4" /> Deactivate/Delete
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}