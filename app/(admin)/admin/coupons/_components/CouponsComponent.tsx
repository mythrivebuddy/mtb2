"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// --- Shadcn UI Imports ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import CouponDialog from "@/components/common/coupons/CouponDialog";
import CouponTabs from "@/components/common/coupons/CouponTabs";
import CouponTable from "@/components/common/coupons/CouponTable";
import {
  Coupon,
  CouponFormPayload,
  Challenge,
  CouponScope
} from "@/types/client/coupons.types";

// --- Types ---
type Plan = {
  id: string;
  name: string;
  interval: string;
  userType: string;
};

const fetchStoreProducts = async () => {
  const res = await axios.get("/api/user/store/items/get-items-by-creatorid");
  return res.data.items;
};
const fetchChallenges = async () => {
  const res = await axios.get<Challenge[]>("/api/admin/challenge")
  return res.data
}
// --- API Helpers ---
const fetchCoupons = async () => {
  const response = await axios.get<Coupon[]>("/api/admin/coupons");
  return response.data;
};

const fetchMmpPrograms = async () => {
  const res = await axios.get("/api/mini-mastery-programs")
  return res.data.programs
}

const fetchPlans = async () => {
  const response = await axios.get<Plan[]>("/api/subscription-plans");
  return response.data;
};

const createCouponApi = async (data: CouponFormPayload) => {
  const response = await axios.post("/api/admin/coupons", data);
  return response.data;
};

const updateCouponApi = async ({
  id,
  data,
}: {
  id: string;
  data: CouponFormPayload;
}) => {
  const response = await axios.put(`/api/admin/coupons/${id}`, data);
  return response.data;
};

const deleteCouponApi = async (id: string) => {
  const response = await axios.delete(`/api/admin/coupons/${id}`);
  return response.data;
};

// --- Main Component ---
export default function CouponsManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | CouponScope>("ALL")

  // --- Form State ---
  const initialFormState: CouponFormPayload = {
    couponCode: "",
    description: "",
    type: "PERCENTAGE", // now correctly inferred as a literal union type
    discountPercentage: "",
    discountAmountUSD: "",
    discountAmountINR: "",
    freeDays: "",
    applicableUserTypes: ["ENTHUSIAST"],
    applicablePlanIds: [],
    scope: "SUBSCRIPTION",
    applicableChallengeIds: [],
    applicableMmpProgramIds: [],
    applicableStoreProductIds: [],
    applicableCurrencies: ["INR", "USD"],
    firstCycleOnly: false,
    multiCycle: false,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    maxGlobalUses: "",
    maxUsesPerUser: 1,
    autoApply: false,
  };

  const [formData, setFormData] = useState<CouponFormPayload>(initialFormState);
  const [isEditDataLoaded, setIsEditDataLoaded] = useState(false);

  // --- React Query Hooks ---
  const { data: coupons = [], isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["coupons"],
    queryFn: fetchCoupons,
  });
  // PLANS
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });
  // CHALLENGES
  const { data: challenges = [] } = useQuery({
    queryKey: ["paid-challenges"],
    queryFn: fetchChallenges,
  });
  // MMP
  const { data: mmpPrograms = [] } = useQuery({
    queryKey: ["mmp-programs"],
    queryFn: fetchMmpPrograms,
  })
  // STORE 
  const { data: storeProducts = [] } = useQuery({
    queryKey: ["store-products"],
    queryFn: fetchStoreProducts,
  });

  const createMutation = useMutation({
    mutationFn: (data: CouponFormPayload) => createCouponApi(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created successfully.");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: CouponFormPayload }) =>
      updateCouponApi(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon updated successfully.");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCouponApi(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deactivated/deleted.");
    },
    onError: () => {
      toast.error("Could not delete coupon.");
    },
  });

  const filteredCoupons = coupons.filter((coupon: Coupon) => {
    if (activeTab === "ALL") return true
    return coupon.scope === activeTab
  })
  // --- Handlers ---
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsEditDataLoaded(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Are you sure? Unused coupons will be deleted, used ones deactivated."
      )
    ) {
      deleteMutation.mutate(id);
    }
  };
  const validateForm = (): string | null => {
    // 1. Coupon code
    if (!formData.couponCode.trim()) {
      return "Coupon code is required";
    }

    // 2. Type-based validation
    if (formData.type === "PERCENTAGE") {
      if (!formData.discountPercentage || Number(formData.discountPercentage) <= 0) {
        return "Enter a valid discount percentage";
      }
    }

    if (formData.type === "FIXED") {
      if (
        !formData.discountAmountUSD &&
        !formData.discountAmountINR
      ) {
        return "Enter at least one fixed amount (USD or INR)";
      }
    }

    if (formData.type === "FREE_DURATION") {
      if (!formData.freeDays || Number(formData.freeDays) <= 0) {
        return "Enter valid free days";
      }
    }

    // 3. User types
    if (!formData.applicableUserTypes.length) {
      return "Select at least one user type";
    }

    // 4. Currency
    if (!formData.applicableCurrencies.length) {
      return "Select at least one currency";
    }

    // 5. Scope-based validation
    if (formData.scope === "SUBSCRIPTION") {
      if (formData.applicablePlanIds?.length === 0) {
        return "Select at least one plan or choose ALL";
      }
    }

    if (formData.scope === "CHALLENGE") {
      // optional: allow ALL (empty = all)
      // but if you want strict:
      // if (formData.applicableChallengeIds.length === 0) return "Select challenge or ALL"
    }

    if (formData.scope === "MMP_PROGRAM") {
      if (formData.applicableMmpProgramIds.length === 0) {
        return "Select at least one MMP program or ALL";
      }
    }

    // 6. Dates
    if (!formData.startDate || !formData.endDate) {
      return "Start and End dates are required";
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      return "End date must be after start date";
    }

    // 7. Max uses
    if (formData.maxUsesPerUser <= 0) {
      return "Max uses per user must be at least 1";
    }

    return null; // ✅ valid
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();

    if (error) {
      toast.error(error);
      return;
    }
    const payload: CouponFormPayload = {
      ...formData,
      discountAmountUSD:
        formData.discountAmountUSD && formData.type === "FIXED"
          ? Number(formData.discountAmountUSD)
          : null,

      discountAmountINR:
        formData.discountAmountINR && formData.type === "FIXED"
          ? Number(formData.discountAmountINR)
          : null,
    };



    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleInputChange = <K extends keyof CouponFormPayload>(
    field: K,
    value: CouponFormPayload[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // const toggleSelection = (
  //   field: "applicablePlanIds" | "applicableCurrencies" | "applicableUserTypes",
  //   value: string
  // ) => {
  //   setFormData((prev) => {
  //     const current = prev[field] as string[];
  //     return current.includes(value)
  //       ? { ...prev, [field]: current.filter((item) => item !== value) }
  //       : { ...prev, [field]: [...current, value] };
  //   });
  // };
  const toggleSelection = (
    field:
      | "applicablePlanIds"
      | "applicableCurrencies"
      | "applicableUserTypes"
      | "applicableChallengeIds"
      | "applicableMmpProgramIds"
      | "applicableStoreProductIds",
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter((i) => i !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };
  const USER_TYPES = ["COACH", "ENTHUSIAST", "SOLOPRENEUR"];

  const handleUserTypeChange = (value: string) => {
    setFormData((prev) => {
      let updated = [...prev.applicableUserTypes];

      // ✅ If ALL clicked
      if (value === "ALL") {
        if (updated.includes("ALL")) {
          // uncheck ALL → clear all
          return { ...prev, applicableUserTypes: [] };
        } else {
          // check ALL → select everything
          return {
            ...prev,
            applicableUserTypes: [...USER_TYPES, "ALL"],
          };
        }
      }

      // ✅ Toggle individual
      if (updated.includes(value)) {
        updated = updated.filter((v) => v !== value);
      } else {
        updated.push(value);
      }

      // ❌ Remove ALL if any individual is removed
      updated = updated.filter((v) => v !== "ALL");

      // ✅ If all individuals selected → add ALL
      const allSelected = USER_TYPES.every((type) =>
        updated.includes(type)
      );

      if (allSelected) {
        updated.push("ALL");
      }

      return { ...prev, applicableUserTypes: updated };
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;


  useEffect(() => {
    if (!editingId) return;

    const coupon = coupons.find((c) => c.id === editingId);
    if (!coupon) return;
    console.log("Coupon challenge IDs:", coupon.applicableChallenges?.map(c => c.id));
    console.log("Available challenges:", challenges.map(c => c.id));

    setFormData({
      couponCode: coupon.couponCode,
      description: coupon.description || "",
      type: coupon.type,
      discountPercentage: coupon.discountPercentage?.toString() || "",
      discountAmountUSD: coupon.discountAmountUSD?.toString() || "",
      discountAmountINR: coupon.discountAmountINR?.toString() || "",
      freeDays: coupon.freeDays?.toString() || "",
      applicableUserTypes: coupon.applicableUserTypes,
      applicablePlanIds: coupon.applicablePlans?.map((p) => p.id) || [],
      applicableChallengeIds: coupon.applicableChallenges?.map((c) => String(c.id)) || [],
      applicableMmpProgramIds: coupon.applicableMmpPrograms?.map((m) => m.id) || [],
      applicableStoreProductIds: coupon.applicableStoreProducts?.map((p) => p.id) || [],
      applicableCurrencies: coupon.applicableCurrencies,
      firstCycleOnly: coupon.firstCycleOnly || false,
      multiCycle: coupon.multiCycle || false,
      startDate: new Date(coupon.startDate).toISOString().split("T")[0],
      endDate: new Date(coupon.endDate).toISOString().split("T")[0],
      maxGlobalUses: coupon.maxGlobalUses?.toString() || "",
      maxUsesPerUser: coupon.maxUsesPerUser || 1,
      autoApply: coupon.autoApply,
      scope: coupon.scope,
    });

    setIsEditDataLoaded(true);

  }, [editingId, coupons, challenges]);
  return (
    <div className="p-8 space-y-8 bg-muted/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Coupons & Discounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage trials, promotional codes, and auto-apply logic.
          </p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          onClick={handleOpenCreate}
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
        <CouponDialog
          open={isDialogOpen}
          setOpen={setIsDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          challenges={challenges}
          mmpPrograms={mmpPrograms}
          storeProducts={storeProducts}
          plans={plans}
          editingId={editingId}
          onClose={resetForm}
          isAdmin={true}
        />
      </div>

      {/* Data Table */}
      <Card>
        <CouponTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
          <CardDescription>Viewing {coupons.length} coupons.</CardDescription>
        </CardHeader>
        <CardContent>
          <CouponTable
            coupons={filteredCoupons}
            isLoading={isLoadingCoupons}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
