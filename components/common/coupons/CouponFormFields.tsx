"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Percent, DollarSign, IndianRupee, Clock } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Challenge, CouponFormPayload, CouponScope, CouponType, MmpProgram, Plan, StoreProduct } from "@/types/client/coupons.types"
import Link from "next/link";
import { useEffect } from "react";



type Props = {
    formData: CouponFormPayload;
    setFormData: React.Dispatch<React.SetStateAction<CouponFormPayload>>;
    onSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
    challenges: Challenge[];
    mmpPrograms: MmpProgram[];
    storeProducts: StoreProduct[];
    plans?: Plan[];
    editingId?: string | null;
    isAdmin?: boolean
};

const USER_TYPES = ["COACH", "ENTHUSIAST", "SOLOPRENEUR"] as const;
const ALL_USER_TYPES = [...USER_TYPES, "ALL"] as const;

export default function CouponFormFields({
    formData,
    setFormData,
    onSubmit,
    challenges,
    mmpPrograms,
    storeProducts,
    plans,
    editingId,
    isAdmin
}: Props) {


    const update = <K extends keyof CouponFormPayload>(field: K, value: CouponFormPayload[K]) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const toggleSelection = (
        field:
            | "applicablePlanIds"
            | "applicableChallengeIds"
            | "applicableMmpProgramIds"
            | "applicableStoreProductIds"
            | "applicableCurrencies",
        id: string
    ) => {
        setFormData((prev) => {
            const list = (prev[field] || []) as string[];
            return {
                ...prev,
                [field]: list.includes(id)
                    ? list.filter((x) => x !== id)
                    : [...list, id],
            };
        });
    };

    const toggleSelectAll = (
        field: "applicablePlanIds" | "applicableChallengeIds" | "applicableMmpProgramIds" | "applicableStoreProductIds",
        allIds: string[]
    ) => {
        setFormData((prev) => {
            const selected = prev[field] as string[];

            const isAllSelected = selected.length === allIds.length;

            return {
                ...prev,
                [field]: isAllSelected ? [] : allIds,
            };
        });
    };
    const handleUserTypeChange = (value: string) => {
        setFormData((prev) => {
            let updated = [...prev.applicableUserTypes];

            if (value === "ALL") {
                updated = updated.includes("ALL") ? [] : [...USER_TYPES, "ALL"];
            } else {
                if (updated.includes(value)) {
                    updated = updated.filter((v) => v !== value && v !== "ALL");
                } else {
                    updated.push(value);
                    if (USER_TYPES.every((t) => updated.includes(t))) updated.push("ALL");
                }
            }

            return { ...prev, applicableUserTypes: updated };
        });
    };

    const handleScopeChange = (val: string) => {
        setFormData((prev) => ({
            ...prev,
            scope: val as CouponScope,
            applicableChallengeIds: [],
            applicableMmpProgramIds: [],
            applicableStoreProductIds: [],
        }));
    };
    useEffect(() => {
        if (!editingId) return;

        // Force re-render so selected cards highlight after data loads
        setFormData((prev) => ({ ...prev }));
    }, [editingId, challenges, mmpPrograms, storeProducts]);
    const showScopedItems = true

    return (
        <form id="coupon-form" onSubmit={onSubmit} className="space-y-6 mt-4">

            {/* ── Basic Info ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Coupon Code</Label>
                    <Input
                        placeholder="SUMMER2026"
                        disabled={!!editingId}
                        className="uppercase "
                        value={formData.couponCode}
                        onChange={(e) => update("couponCode", e.target.value.toUpperCase())}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(val) => update("type", val as CouponType)}
                    >
                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>

                            <SelectItem value="FULL_DISCOUNT">100% Off</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Internal Description</Label>
                <Input
                    placeholder="e.g. Special offer for new members"
                    value={formData.description}
                    onChange={(e) => update("description", e.target.value)}
                />
            </div>

            {/* ── Value Configuration ── */}
            {
                formData.type !== "FULL_DISCOUNT" && (
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-6">
                                {formData.type === "PERCENTAGE" && (
                                    <div className="space-y-2">
                                        <Label>Discount Percentage (%)</Label>
                                        <div className="relative">
                                            <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                className="pl-9"
                                                value={formData.discountPercentage}
                                                onChange={(e) => update("discountPercentage", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.type === "FIXED" && (
                                    <div className="space-y-3 col-span-2">
                                        <Label>Fixed Discount Amount</Label>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* USD */}
                                            <div className="relative w-full">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    placeholder="USD"
                                                    className="pl-9 w-full"
                                                    value={formData.discountAmountUSD ?? ""}
                                                    onChange={(e) => update("discountAmountUSD", e.target.value)}
                                                />
                                            </div>

                                            {/* INR */}
                                            <div className="relative w-full">
                                                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    placeholder="INR"
                                                    className="pl-9 w-full"
                                                    value={formData.discountAmountINR ?? ""}
                                                    onChange={(e) => update("discountAmountINR", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.type === "FREE_DURATION" && (
                                    <div className="space-y-2">
                                        <Label>Free Days</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                className="pl-9"
                                                value={formData.freeDays}
                                                onChange={(e) => update("freeDays", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            }


            {/* ── Scope ── */}
            <div className="space-y-2">
                <Label>Coupon Scope</Label>
                <Select value={formData.scope} onValueChange={handleScopeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {isAdmin && (
                            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                        )}
                        <SelectItem value="CHALLENGE">Challenge</SelectItem>
                        <SelectItem value="MMP_PROGRAM">Mini Mastery Program</SelectItem>
                        <SelectItem value="STORE_PRODUCT">Store Products</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {showScopedItems && formData.scope === "SUBSCRIPTION" && (
                <div className="space-y-3">
                    <Label>Applicable Plans</Label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {/* Select All */}
                        <div
                            onClick={() =>
                                toggleSelectAll(
                                    "applicablePlanIds",
                                    (plans || []).map((p) => p.id)
                                )
                            }
                            className={`cursor-pointer rounded-md border p-3 text-sm transition-all font-medium
        flex flex-col items-center justify-center text-center min-h-[72px]
        ${(plans || []).length > 0 &&
                                    (plans || []).every((p) =>
                                        formData.applicablePlanIds?.includes(p.id)
                                    )
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "hover:bg-accent"
                                }`}
                        >
                            <div>Select All</div>
                            <div className="text-xs text-muted-foreground">
                                Apply to all plans
                            </div>
                        </div>

                        {(plans || []).map((p) => (
                            <div
                                key={p.id}
                                onClick={() =>
                                    toggleSelection("applicablePlanIds", p.id)
                                }
                                className={`cursor-pointer rounded-md border p-3 text-sm transition-all
          ${formData.applicablePlanIds?.includes(p.id)
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "hover:bg-accent"
                                    }`}
                            >
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {p.interval} • {p.userType}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* ── Challenge Selector ── */}
            {showScopedItems && formData.scope === "CHALLENGE" && (
                <div className="space-y-3">
                    <Label>Applicable Challenges</Label>

                    {challenges.length === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                            You have no active challenges yet.{" "}
                            <Link href="/dashboard/challenges/create" className="text-primary underline underline-offset-2">
                                Create a challenge
                            </Link>{" "}
                            to use this coupon scope.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">

                            {/* Select All Card */}
                            <div
                                onClick={() => toggleSelectAll("applicableChallengeIds", challenges.map(c => c.id))}
                                className={`cursor-pointer rounded-md border  p-3 text-sm transition-all font-medium
    flex flex-col items-center justify-center text-center min-h-[72px]
    ${challenges.every(c => formData.applicableChallengeIds.includes(c.id))
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "hover:bg-accent"
                                    }`}
                            >
                                <div>Select All</div>
                                <div className="text-xs text-muted-foreground">Apply to all challenges</div>
                            </div>
                            {challenges.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => toggleSelection("applicableChallengeIds", c.id)}
                                    className={`cursor-pointer rounded-md border p-3 text-sm transition-all
                    ${formData.applicableChallengeIds.includes(c.id)
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "hover:bg-accent"}`}
                                >
                                    <div className="font-medium">{c.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {c.challengeJoiningFeeCurrency} {c.challengeJoiningFee}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── MMP Program Selector ── */}
            {showScopedItems && formData.scope === "MMP_PROGRAM" && (
                <div className="space-y-3">
                    <Label>Applicable MMP Programs</Label>

                    {mmpPrograms.length === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                            You have no MMP programs yet.{" "}
                            <Link href="/dashboard/mini-mastery-programs" className="text-primary underline underline-offset-2">
                                Create an MMP program
                            </Link>{" "}
                            to use this coupon scope.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div
                                onClick={() =>
                                    toggleSelectAll(
                                        "applicableMmpProgramIds",
                                        mmpPrograms.map((m) => m.id)
                                    )
                                }
                                className={`cursor-pointer rounded-md border  p-3 text-sm transition-all font-medium
    flex flex-col items-center justify-center text-center min-h-[72px]
    ${mmpPrograms.length > 0 &&
                                        mmpPrograms.every((m) =>
                                            formData.applicableMmpProgramIds.includes(m.id)
                                        )
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "hover:bg-accent"
                                    }`}
                            >
                                <div>Select All</div>
                                <div className="text-xs text-muted-foreground">
                                    Apply to all programs
                                </div>
                            </div>
                            {mmpPrograms.map((m) => (
                                <div
                                    key={m.id}
                                    onClick={() => toggleSelection("applicableMmpProgramIds", m.id)}
                                    className={`cursor-pointer rounded-md border p-3 text-sm transition-all
                    ${formData.applicableMmpProgramIds.includes(m.id)
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "hover:bg-accent"}`}
                                >
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-xs text-muted-foreground">{m.currency} {m.price}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Store Product Selector ── */}
            {showScopedItems && formData.scope === "STORE_PRODUCT" && (
                <div className="space-y-3">
                    <Label>Applicable Store Products</Label>

                    {storeProducts.length === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                            You have no store products yet.{" "}
                            <Link href="/dashboard/store" className="text-primary underline underline-offset-2">
                                Add a product
                            </Link>{" "}
                            to use this coupon scope.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">

                            <div
                                onClick={() =>
                                    toggleSelectAll(
                                        "applicableStoreProductIds",
                                        storeProducts.map((p) => p.id)
                                    )
                                }
                                className={`cursor-pointer rounded-md border p-3 text-sm transition-all font-medium
    flex flex-col items-center justify-center text-center min-h-[72px]
    ${storeProducts.length > 0 &&
                                        storeProducts.every((p) =>
                                            formData.applicableStoreProductIds.includes(p.id)
                                        )
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "hover:bg-accent"
                                    }`}
                            >
                                <div>Select All</div>
                                <div className="text-xs text-muted-foreground">
                                    Apply to all products
                                </div>
                            </div>
                            {storeProducts.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => toggleSelection("applicableStoreProductIds", p.id)}
                                    className={`cursor-pointer rounded-md border p-3 text-sm transition-all
                    ${formData?.applicableStoreProductIds?.includes(p.id)
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "hover:bg-accent"}`}
                                >
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">{p.currency} {p.basePrice}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── User Types & Currency ── */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label>User Types</Label>
                    <div className="flex flex-col gap-2">
                        {ALL_USER_TYPES.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`user-${type}`}
                                    checked={formData?.applicableUserTypes?.includes(type)}
                                    onCheckedChange={() => handleUserTypeChange(type)}
                                />
                                <Label htmlFor={`user-${type}`} className="cursor-pointer font-normal">{type}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Currency</Label>
                    <div className="flex gap-4">
                        {(["INR", "USD"] as const).map((curr) => (
                            <div key={curr} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`curr-${curr}`}
                                    checked={formData?.applicableCurrencies?.includes(curr)}
                                    onCheckedChange={() => toggleSelection("applicableCurrencies", curr)}
                                />
                                <Label htmlFor={`curr-${curr}`}>{curr}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Validity ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate} onChange={(e) => update("startDate", e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.endDate} onChange={(e) => update("endDate", e.target.value)} required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Max Global Uses</Label>
                    <Input
                        type="number"
                        placeholder="Unlimited"
                        value={formData.maxGlobalUses}
                        onChange={(e) => update("maxGlobalUses", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Max Per User</Label>
                    <Input
                        type="number"
                        value={formData.maxUsesPerUser}
                        onChange={(e) => update("maxUsesPerUser", Number(e.target.value))}
                    />
                </div>
            </div>

            {/* ── Auto Apply ── */}
            <div className="rounded-lg border p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-base">Auto Apply Logic</Label>
                    <p className="text-sm text-muted-foreground">Coupon will be auto applied during checkout</p>
                </div>
                <Switch
                    checked={formData.autoApply}
                    onCheckedChange={(checked) => update("autoApply", checked)}
                />
            </div>
        </form>
    );
}