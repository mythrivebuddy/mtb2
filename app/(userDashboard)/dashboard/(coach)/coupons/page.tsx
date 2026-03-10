"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
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

type Challenge = {
    id: string;
    title: string;
    challengeJoiningFee: number;
    challengeJoiningFeeCurrency: "INR" | "USD";
};

type Coupon = {
    id: string;
    couponCode: string;
    type: "PERCENTAGE" | "FIXED" | "FULL_DISCOUNT";
    status: "ACTIVE" | "INACTIVE" | "EXPIRED";
    scope?: "CHALLENGE" | "STORE" | "MMP";
    autoApply?: boolean;
};
type CoachDataResponse = {
    challenges: Challenge[];
    coupons: Coupon[];
};

type CouponForm = {
    couponCode: string;
    type: Coupon["type"];
    discountPercentage: string | number;
    discountAmountUSD: string | number;
    discountAmountINR: string | number;
    applicableChallengeIds: string[];
    startDate: string;
    endDate: string;
    autoApply: boolean;
};

const fetchCoachData = async (): Promise<CoachDataResponse> => {
    const { data } = await axios.get<CoachDataResponse>("/api/coupons/coach");
    return data;
};
const createCoupon = async (payload: CouponForm) => {
    const { data } = await axios.post("/api/coupons/coach", payload);
    return data;
};

export default function CoachCouponsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [couponError, setCouponError] = useState("");

    const [activeTab, setActiveTab] = useState<
        "ALL" | "CHALLENGE" | "STORE" | "MMP"
    >("ALL");

    const initialForm: CouponForm = {
        couponCode: "",
        type: "PERCENTAGE",
        discountPercentage: "",
        discountAmountUSD: "",
        discountAmountINR: "",
        applicableChallengeIds: [],
        startDate: "",
        endDate: "",
        autoApply: false,
    };

    const [formData, setFormData] = useState(initialForm);

    const { data, isLoading } = useQuery<CoachDataResponse>({
        queryKey: ["coach-data"],
        queryFn: fetchCoachData,
    });

    const challenges = data?.challenges ?? [];
    const coupons = data?.coupons ?? [];

    const createMutation = useMutation({
        mutationFn: createCoupon,

        onSuccess: (newCoupon) => {
            toast.success("Coupon created");
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

    const toggleChallenge = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            applicableChallengeIds: prev.applicableChallengeIds.includes(id)
                ? prev.applicableChallengeIds.filter((c) => c !== id)
                : [...prev.applicableChallengeIds, id],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCouponError("");
        createMutation.mutate(formData);
    };

    const filteredCoupons = coupons.filter((coupon: Coupon) => {
        if (activeTab === "ALL") return true;
        return coupon.scope === activeTab;
    });
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
                                Offer discounts for your challenges
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Coupon Code */}

                            <div className="space-y-1">
                                <Label>Coupon Code</Label>

                                <Input
                                    value={formData.couponCode}
                                    onChange={(e) => {
                                        setCouponError("");
                                        setFormData({
                                            ...formData,
                                            couponCode: e.target.value.toUpperCase(),
                                        });
                                    }}
                                />

                                {couponError && (
                                    <p className="text-sm text-red-500">{couponError}</p>
                                )}
                            </div>

                            {/* Discount Type */}

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

                            {/* Percentage */}

                            {formData.type === "PERCENTAGE" && (
                                <div className="space-y-2">

                                    <Label>Percentage</Label>

                                    <div className="relative">

                                        <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                        <Input
                                            type="number"
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

                            {/* Fixed Amount */}

                            {formData.type === "FIXED" && (

                                <div className="grid grid-cols-2 gap-4">

                                    <div className="space-y-2">
                                        <Label>USD Amount</Label>

                                        <Input
                                            type="number"
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
                                        <Label>INR Amount</Label>

                                        <Input
                                            type="number"
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

                            {/* Challenges */}

                            <div className="space-y-2">

                                <Label>Applicable Challenges</Label>

                                <div className="grid grid-cols-2 gap-2">

                                    {Array.isArray(challenges) && challenges?.map((challenge) => (

                                        <div
                                            key={challenge.id}
                                            onClick={() => toggleChallenge(challenge.id)}
                                            className={`border rounded-md p-3 cursor-pointer text-sm
                        ${formData.applicableChallengeIds.includes(challenge.id)
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

                            {/* Dates */}

                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <Label>Start Date</Label>

                                    <Input
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
                                    <Label>End Date</Label>

                                    <Input
                                        type="date"
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

                            {/* Auto Apply */}

                            <div className="flex items-center justify-between border rounded-lg p-4">

                                <div className="space-y-0.5">
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

                                <Button type="submit">

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

            {/* Tabs */}

            <Tabs
                defaultValue="ALL"
                onValueChange={(v) =>
                    setActiveTab(v as "ALL" | "CHALLENGE" | "STORE" | "MMP")
                }
            >
                <TabsList>

                    <TabsTrigger value="ALL">All</TabsTrigger>
                    <TabsTrigger value="CHALLENGE">Challenges</TabsTrigger>
                    <TabsTrigger value="STORE">Store</TabsTrigger>
                    <TabsTrigger value="MMP">MMP</TabsTrigger>

                </TabsList>
            </Tabs>

            {/* Table */}

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
                                <TableHead>Status</TableHead>

                            </TableRow>

                        </TableHeader>

                        <TableBody>

                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCoupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No coupons found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCoupons?.map((coupon: Coupon) => (

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