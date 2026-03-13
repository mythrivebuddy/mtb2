"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableHeader,
} from "@/components/ui/table";

import {
    Dialog,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogContent,
    DialogFooter,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ---------------------------------------------------- */
/* TYPES */
/* ---------------------------------------------------- */

type CouponScope = "CHALLENGE" | "MMP_PROGRAM" | "STORE";

type Challenge = {
    id: string;
    title: string;
    challengeJoiningFee: number;
    challengeJoiningFeeCurrency: "INR" | "USD";
};

type MmpProgram = {
    id: string;
    name: string;
    price: number;
    currency: "INR" | "USD";
};

type Product = {
    id: string;
    name: string;
    price: number;
    currency: "INR" | "USD";
};

type Coupon = {
    id: string;
    couponCode: string;
    type: "PERCENTAGE" | "FIXED" | "FULL_DISCOUNT";
    status: "ACTIVE" | "INACTIVE" | "EXPIRED";
    scope: CouponScope;
    autoApply?: boolean;
};

type CoachDataResponse = {
    challenges: Challenge[];
    mmpPrograms: MmpProgram[];
    products: Product[];
    coupons: Coupon[];
};

type CouponForm = {
    couponCode: string;
    type: Coupon["type"];

    discountPercentage: string | number;
    discountAmountUSD: string | number;
    discountAmountINR: string | number;

    scope: CouponScope;

    applicableChallengeIds: string[];
    applicableMmpProgramIds: string[];
    applicableProductIds: string[];

    startDate: string;
    endDate: string;

    autoApply: boolean;
};

/* ---------------------------------------------------- */
/* API */
/* ---------------------------------------------------- */

const fetchCoachData = async (): Promise<CoachDataResponse> => {
    const { data } = await axios.get("/api/coupons/coach");
    return data;
};

const createCoupon = async (payload: CouponForm) => {
    const { data } = await axios.post("/api/coupons/coach", payload);
    return data;
};

const fetchMmpPrograms = async (): Promise<MmpProgram[]> => {
    const res = await axios.get("/api/mini-mastery-programs");
    return res.data.programs;
};

/* ---------------------------------------------------- */
/* COMPONENT */
/* ---------------------------------------------------- */

export default function CoachCouponsPage() {
    const queryClient = useQueryClient();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [couponError, setCouponError] = useState("");

    const [activeTab, setActiveTab] = useState<
        "ALL" | "CHALLENGE" | "STORE" | "MMP_PROGRAM"
    >("ALL");

    const initialForm: CouponForm = {
        couponCode: "",
        type: "PERCENTAGE",

        discountPercentage: "",
        discountAmountUSD: "",
        discountAmountINR: "",

        scope: "CHALLENGE",

        applicableChallengeIds: [],
        applicableMmpProgramIds: [],
        applicableProductIds: [],

        startDate: "",
        endDate: "",

        autoApply: false,
    };

    const [formData, setFormData] = useState(initialForm);

    const { data, isLoading: isCoachDataLoading } = useQuery({
        queryKey: ["coach-data"],
        queryFn: fetchCoachData,
    });

    const { data: mmpProgramsData, isLoading: isMmpProgramsLoading } = useQuery({
        queryKey: ["mmp-programs"],
        queryFn: fetchMmpPrograms,
    });

    const challenges = data?.challenges ?? [];
    const mmpPrograms = mmpProgramsData ?? [];
    const products = data?.products ?? [];
    const coupons = data?.coupons ?? [];

    const isLoading = isCoachDataLoading || isMmpProgramsLoading;

    /* ---------------------------------------------------- */
    /* MUTATION */
    /* ---------------------------------------------------- */

    const createMutation = useMutation({
        mutationFn: createCoupon,

        onSuccess: () => {
            toast.success("Coupon created");
            queryClient.invalidateQueries({ queryKey: ["coach-data"] });

            setFormData(initialForm);
            setDialogOpen(false);
            setCouponError("");
        },

        onError: (error: AxiosError<{ error?: string }>) => {
            const message =
                error.response?.data?.error ?? "Failed to create coupon";

            toast.error(message);

            if (message.toLowerCase().includes("exists")) {
                setCouponError("Coupon code already exists");
            }
        },
    });

    /* ---------------------------------------------------- */
    /* HELPERS */
    /* ---------------------------------------------------- */

    const toggleSelection = (
        field:
            | "applicableChallengeIds"
            | "applicableMmpProgramIds"
            | "applicableProductIds",
        id: string
    ) => {
        setFormData((prev) => {
            const list = prev[field];

            return list.includes(id)
                ? { ...prev, [field]: list.filter((x) => x !== id) }
                : { ...prev, [field]: [...list, id] };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCouponError("");

        // Custom form validations
        if (formData.type === "PERCENTAGE") {
            const pct = Number(formData.discountPercentage);
            if (pct <= 0 || pct > 100) {
                return toast.error("Percentage must be between 1 and 100");
            }
        }

        if (formData.type === "FIXED") {
            if (Number(formData.discountAmountUSD) <= 0 || Number(formData.discountAmountINR) <= 0) {
                return toast.error("Fixed amounts must be greater than 0");
            }
        }

        if (formData.scope === "CHALLENGE" && formData.applicableChallengeIds.length === 0) {
            return toast.error("Please select at least one applicable challenge");
        }

        if (formData.scope === "MMP_PROGRAM" && formData.applicableMmpProgramIds.length === 0) {
            return toast.error("Please select at least one applicable MMP program");
        }

        if (formData.scope === "STORE" && formData.applicableProductIds.length === 0) {
            return toast.error("Please select at least one applicable product");
        }

        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            return toast.error("End date cannot be before the start date");
        }

        createMutation.mutate(formData);
    };

    const filteredCoupons = coupons.filter((coupon) => {
        if (activeTab === "ALL") return true;
        return coupon.scope === activeTab;
    });

    /* ---------------------------------------------------- */
    /* UI */
    /* ---------------------------------------------------- */

    return (
        <div className="p-8 space-y-8 bg-muted/30 min-h-screen">
            {/* HEADER */}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Coupons</h1>
                    <p className="text-muted-foreground">
                        Manage coupons for your ecosystem
                    </p>
                </div>

                {/* CREATE DIALOG */}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Coupon</DialogTitle>
                            <DialogDescription>
                                Offer discounts for your products
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* CODE */}

                            <div className="space-y-1">
                                <Label>Coupon Code <span className="text-red-500">*</span></Label>

                                <Input
                                    required
                                    minLength={3}
                                    placeholder="e.g. SUMMER20"
                                    value={formData.couponCode}
                                    onChange={(e) => {
                                        setCouponError("");

                                        setFormData({
                                            ...formData,
                                            couponCode: e.target.value.toUpperCase().replace(/\s+/g, ""), // Prevent spaces
                                        });
                                    }}
                                />

                                {couponError && (
                                    <p className="text-sm text-red-500">{couponError}</p>
                                )}
                            </div>

                            {/* SCOPE */}

                            <div className="space-y-2">
                                <Label>Coupon Scope</Label>

                                <Select
                                    value={formData.scope}
                                    onValueChange={(v: CouponScope) =>
                                        setFormData({
                                            ...formData,
                                            scope: v,
                                            applicableChallengeIds: [],
                                            applicableMmpProgramIds: [],
                                            applicableProductIds: [],
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="CHALLENGE">Challenge</SelectItem>
                                        <SelectItem value="MMP_PROGRAM">
                                            Mini Mastery Program
                                        </SelectItem>
                                        <SelectItem value="STORE">Store Product</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* DISCOUNT TYPE */}

                            <div className="space-y-2">
                                <Label>Discount Type</Label>

                                <Select
                                    value={formData.type}
                                    onValueChange={(v: Coupon["type"]) =>
                                        setFormData({
                                            ...formData,
                                            type: v,
                                            discountPercentage: "",
                                            discountAmountUSD: "",
                                            discountAmountINR: "",
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">
                                            Percentage Discount
                                        </SelectItem>

                                        <SelectItem value="FIXED">
                                            Fixed Amount
                                        </SelectItem>

                                        <SelectItem value="FULL_DISCOUNT">
                                            100% Off
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PERCENTAGE */}

                            {formData.type === "PERCENTAGE" && (
                                <div className="space-y-2">
                                    <Label>Percentage <span className="text-red-500">*</span></Label>

                                    <div className="relative">
                                        <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                        <Input
                                            required
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="pl-9"
                                            placeholder="10"
                                            value={formData.discountPercentage}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    discountPercentage: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* FIXED */}

                            {formData.type === "FIXED" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>USD Amount <span className="text-red-500">*</span></Label>

                                        <Input
                                            required
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="10"
                                            value={formData.discountAmountUSD}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    discountAmountUSD: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>INR Amount <span className="text-red-500">*</span></Label>

                                        <Input
                                            required
                                            type="number"
                                            min="1"
                                            placeholder="500"
                                            value={formData.discountAmountINR}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    discountAmountINR: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* CHALLENGE SELECTION */}

                            {formData.scope === "CHALLENGE" && (
                                <div className="space-y-2">
                                    <Label>Applicable Challenges <span className="text-red-500">*</span></Label>

                                    <div className="grid grid-cols-2 gap-2">
                                        {challenges.map((challenge) => (
                                            <div
                                                key={challenge.id}
                                                onClick={() =>
                                                    toggleSelection(
                                                        "applicableChallengeIds",
                                                        challenge.id
                                                    )
                                                }
                                                className={`border rounded-md p-3 cursor-pointer text-sm transition-colors
                        ${formData.applicableChallengeIds.includes(
                                                    challenge.id
                                                )
                                                        ? "border-primary bg-primary/5"
                                                        : "hover:bg-accent"
                                                    }`}
                                            >
                                                <div className="font-medium">
                                                    {challenge.title}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {challenge.challengeJoiningFeeCurrency}{" "}
                                                    {challenge.challengeJoiningFee}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* MMP PROGRAM */}

                            {formData.scope === "MMP_PROGRAM" && (
                                <div className="space-y-2">
                                    <Label>Applicable MMP Programs <span className="text-red-500">*</span></Label>

                                    <div className="grid grid-cols-2 gap-2">
                                        {mmpPrograms.map((program) => (
                                            <div
                                                key={program.id}
                                                onClick={() =>
                                                    toggleSelection(
                                                        "applicableMmpProgramIds",
                                                        program.id
                                                    )
                                                }
                                                className={`border rounded-md p-3 cursor-pointer text-sm transition-colors
                        ${formData.applicableMmpProgramIds.includes(
                                                    program.id
                                                )
                                                        ? "border-primary bg-primary/5"
                                                        : "hover:bg-accent"
                                                    }`}
                                            >
                                                <div className="font-medium">
                                                    {program.name}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {program.currency} {program.price}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STORE */}

                            {formData.scope === "STORE" && (
                                <div className="space-y-2">
                                    <Label>Applicable Products <span className="text-red-500">*</span></Label>

                                    <div className="grid grid-cols-2 gap-2">
                                        {products.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() =>
                                                    toggleSelection(
                                                        "applicableProductIds",
                                                        product.id
                                                    )
                                                }
                                                className={`border rounded-md p-3 cursor-pointer text-sm transition-colors
                        ${formData.applicableProductIds.includes(
                                                    product.id
                                                )
                                                        ? "border-primary bg-primary/5"
                                                        : "hover:bg-accent"
                                                    }`}
                                            >
                                                <div className="font-medium">
                                                    {product.name}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {product.currency} {product.price}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DATES */}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date <span className="text-red-500">*</span></Label>

                                    <Input
                                        required
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                startDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>End Date <span className="text-red-500">*</span></Label>

                                    <Input
                                        required
                                        type="date"
                                        min={formData.startDate} // Automatically prevents picking earlier dates via HTML
                                        value={formData.endDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                endDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {/* AUTO APPLY */}

                            <div className="flex items-center justify-between border rounded-lg p-4">
                                <div>
                                    <Label>Auto Apply</Label>

                                    <p className="text-sm text-muted-foreground">
                                        Automatically apply this coupon at checkout
                                    </p>
                                </div>

                                <Switch
                                    checked={formData.autoApply}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            autoApply: checked,
                                        })
                                    }
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    )}
                                    Save Coupon
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* TABS */}

            <Tabs
                defaultValue="ALL"
                onValueChange={(v) =>
                    setActiveTab(v as "ALL" | "CHALLENGE" | "STORE" | "MMP_PROGRAM")
                }
            >
                <TabsList>
                    <TabsTrigger value="ALL">All</TabsTrigger>
                    <TabsTrigger value="CHALLENGE">Challenges</TabsTrigger>
                    <TabsTrigger value="STORE">Store</TabsTrigger>
                    <TabsTrigger value="MMP_PROGRAM">MMP</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* TABLE */}

            <Card>
                <CardHeader>
                    <CardTitle>Your Coupons</CardTitle>

                    <CardDescription>
                        Manage coupons across products
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCoupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        No coupons found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-mono">
                                            {coupon.couponCode}
                                        </TableCell>

                                        <TableCell>
                                            {coupon.type}

                                            {coupon.autoApply && (
                                                <Badge className="ml-2 bg-purple-500">
                                                    AUTO
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant="outline">
                                                {coupon.scope}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <Badge>{coupon.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}