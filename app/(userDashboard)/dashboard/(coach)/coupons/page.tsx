"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import CouponDialog from "@/components/common/coupons/CouponDialog";
import CouponTabs from "@/components/common/coupons/CouponTabs";
import CouponTable from "@/components/common/coupons/CouponTable";
import DeleteCouponDialog from "@/components/common/coupons/DeleteCouponDialog";
import { CoachDataResponse, Coupon, CouponFormPayload, CouponScope, MmpProgram, UpdateCouponPayload } from "@/types/client/coupons.types";



/* ------------------------------------------------------------------ */
/* API                                                                  */
/* ------------------------------------------------------------------ */

const fetchCoachData = async (): Promise<CoachDataResponse> => {
    const { data } = await axios.get("/api/coupons/coach");
    return data;
};

const fetchMmpPrograms = async (): Promise<MmpProgram[]> => {
    const res = await axios.get("/api/mini-mastery-programs");
    return res.data.programs;
};

const createCouponApi = async (payload: CouponFormPayload): Promise<Coupon> => {
    const { data } = await axios.post("/api/coupons/coach", payload);
    return data;
};

const updateCouponApi = async ({ id, data }: { id: string; data: UpdateCouponPayload }): Promise<Coupon> => {
    const res = await axios.put(`/api/coupons/coach/${id}`, data);
    return res.data;
};

const deleteCouponApi = async (id: string): Promise<void> => {
    await axios.delete(`/api/coupons/coach/${id}`);
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                            */
/* ------------------------------------------------------------------ */

const INITIAL_FORM: CouponFormPayload = {
    couponCode: "",
    description: "",
    type: "PERCENTAGE",
    discountPercentage: "",
    discountAmountUSD: "",
    discountAmountINR: "",
    freeDays: "",
    applicableUserTypes: ["ENTHUSIAST"],
    applicableCurrencies: ["INR", "USD"],
    applicableChallengeIds: [],
    applicableMmpProgramIds: [],
    applicableStoreProductIds: [],
    scope: "CHALLENGE",
    firstCycleOnly: false,
    multiCycle: false,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    maxGlobalUses: "",
    maxUsesPerUser: 1,
    autoApply: false,
};
const fetchStoreProducts = async () => {
    const res = await axios.get("/api/user/store/items/get-items-by-creatorid");
    return res.data.items;
};

export default function CoachCouponsPage() {
    const queryClient = useQueryClient();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CouponFormPayload>(INITIAL_FORM);
    const [activeTab, setActiveTab] = useState<"ALL" | CouponScope>("ALL");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    /* ---- Queries ---- */

    const { data: coachData, isLoading: isCoachDataLoading } = useQuery({
        queryKey: ["coach-data"],
        queryFn: fetchCoachData,
    });

    const { data: mmpProgramsData, isLoading: isMmpLoading } = useQuery({
        queryKey: ["mmp-programs"],
        queryFn: fetchMmpPrograms,
    });
    const { data: storeProductsData } = useQuery({
        queryKey: ["store-products"],
        queryFn: fetchStoreProducts,
    });


    const challenges = coachData?.challenges ?? [];
    const mmpPrograms = mmpProgramsData ?? [];
    const storeProducts = storeProductsData ?? [];
    const coupons = coachData?.coupons ?? [];
    const isLoading = isCoachDataLoading || isMmpLoading;

    /* ---- Mutations ---- */

    const createMutation = useMutation({
        mutationFn: createCouponApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coach-data"] });
            toast.success("Coupon created successfully.");
            setDialogOpen(false);
            resetForm();
        },
        onError: (error: AxiosError<{ error?: string }>) => {
            toast.error(error.response?.data?.error ?? "Failed to create coupon");
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateCouponApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coach-data"] });
            toast.success("Coupon updated successfully.");
            setDialogOpen(false);
            resetForm();
        },
        onError: (error: AxiosError<{ error?: string }>) => {
            toast.error(error.response?.data?.error ?? "Failed to update coupon");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCouponApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coach-data"] });
            toast.success("Coupon deactivated/deleted.");
            setDeleteDialogOpen(false);
            setDeletingId(null);
        },
        onError: () => {
            toast.error("Could not delete coupon.");
        },
    });

    /* ---- Helpers ---- */

    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setEditingId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const handleEdit = (coupon: Coupon) => {

        const userTypes = coupon.applicableUserTypes || [];

        const normalizedUserTypes =
            ["COACH", "ENTHUSIAST", "SOLOPRENEUR"].every((t) =>
                userTypes.includes(t)
            )
                ? [...userTypes, "ALL"]
                : userTypes;

        setEditingId(coupon.id);

        setFormData({
            couponCode: coupon.couponCode,
            description: coupon.description ?? "",
            type: coupon.type,
            discountPercentage: coupon.discountPercentage?.toString() ?? "",
            discountAmountUSD: coupon.discountAmountUSD?.toString() ?? "",
            discountAmountINR: coupon.discountAmountINR?.toString() ?? "",
            discountAmountGP: coupon.discountAmountGP?.toString() || "",
            freeDays: coupon.freeDays?.toString() ?? "",
            applicableUserTypes: normalizedUserTypes,
            applicableCurrencies: coupon.applicableCurrencies ?? [],
            applicableChallengeIds: coupon.applicableChallenges?.map((c) => c.id) ?? [],
            applicableMmpProgramIds: coupon.applicableMmpPrograms?.map((m) => m.id) ?? [],
            applicableStoreProductIds: coupon.applicableStoreProducts?.map((p) => p.id) ?? [],
            scope: coupon.scope,
            firstCycleOnly: coupon.firstCycleOnly ?? false,
            multiCycle: coupon.multiCycle ?? false,
            startDate: new Date(coupon.startDate).toISOString().split("T")[0],
            endDate: new Date(coupon.endDate).toISOString().split("T")[0],
            maxGlobalUses: coupon.maxGlobalUses?.toString() ?? "",
            maxUsesPerUser: coupon.maxUsesPerUser ?? 1,
            autoApply: coupon.autoApply,
        });


        setDialogOpen(true);
    };


    const handleDelete = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        deleteMutation.mutate(deletingId);
    };

    const validateForm = (): string | null => {
        if (!formData.couponCode.trim()) return "Coupon code is required";

        if (formData.type === "PERCENTAGE") {
            const pct = Number(formData.discountPercentage);
            if (!pct || pct <= 0 || pct > 100) return "Enter a valid discount percentage (1–100)";
        }

        if (formData.type === "FIXED") {
            if (!formData.discountAmountUSD && !formData.discountAmountINR)
                return "Enter at least one fixed amount (USD or INR)";
        }

        if (formData.type === "FREE_DURATION") {
            if (!formData.freeDays || Number(formData.freeDays) <= 0) return "Enter valid free days";
        }

        if (!formData.applicableUserTypes.length) return "Select at least one user type";
        if (!formData.applicableCurrencies.length) return "Select at least one currency";

        if (formData.scope === "MMP_PROGRAM" && formData.applicableMmpProgramIds.length === 0)
            return "Select at least one MMP program or choose All";

        if (!formData.startDate || !formData.endDate) return "Start and End dates are required";
        if (new Date(formData.startDate) > new Date(formData.endDate))
            return "End date must be after start date";

        if (formData.maxUsesPerUser <= 0) return "Max uses per user must be at least 1";

        return null;
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateForm();
        if (error) { toast.error(error); return; }

        const payload = {
            description: formData.description,
            type: formData.type,

            discountPercentage:
                formData.type === "PERCENTAGE"
                    ? Number(formData.discountPercentage)
                    : null,

            discountAmountUSD:
                formData.type === "FIXED" && formData.discountAmountUSD
                    ? Number(formData.discountAmountUSD)
                    : null,

            discountAmountINR:
                formData.type === "FIXED" && formData.discountAmountINR
                    ? Number(formData.discountAmountINR)
                    : null,

            freeDays:
                formData.type === "FREE_DURATION"
                    ? Number(formData.freeDays)
                    : null,

            maxGlobalUses: formData.maxGlobalUses
                ? Number(formData.maxGlobalUses)
                : null,

            maxUsesPerUser: formData.maxUsesPerUser,

            startDate: formData.startDate,
            endDate: formData.endDate,

            applicableChallengeIds: formData.applicableChallengeIds,
            applicableMmpProgramIds: formData.applicableMmpProgramIds,
            applicableStoreProductIds: formData.applicableStoreProductIds,

            applicableUserTypes: formData.applicableUserTypes,
            applicableCurrencies: formData.applicableCurrencies,

            autoApply: formData.autoApply,
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(formData);
        }
    };

    const filteredCoupons = coupons.filter((c) => activeTab === "ALL" || c.scope === activeTab);
    const isSaving = createMutation.isPending || updateMutation.isPending;

    /* ---- Render ---- */

    return (
        <div className="py-8 px-4 sm:px-8 space-y-8 max-w-8xl  min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coupons & Discounts</h1>
                    <p className="text-muted-foreground mt-1">Manage promotional codes for your challenges, programs, and products.</p>
                </div>

                <Button className="gap-2 w-full sm:w-fit bg-gradient-to-r from-blue-500 to-indigo-600  hover:from-blue-600 hover:to-indigo-700 " onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4" /> Create Coupon
                </Button>
            </div>

            <CouponDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                formData={formData}
                setFormData={setFormData}
                onClose={resetForm}
                onSubmit={handleSubmit}
                isSaving={isSaving}
                challenges={challenges}
                mmpPrograms={mmpPrograms}
                storeProducts={storeProducts}
                editingId={editingId}
            />

            {/* Table */}
            <Card>
                <CouponTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <CardHeader>
                    <CardTitle>Your Coupons</CardTitle>
                    <CardDescription>Viewing {filteredCoupons.length} coupon{filteredCoupons.length !== 1 ? "s" : ""}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CouponTable
                        coupons={filteredCoupons}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>
            <DeleteCouponDialog
                open={deleteDialogOpen}
                setOpen={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}