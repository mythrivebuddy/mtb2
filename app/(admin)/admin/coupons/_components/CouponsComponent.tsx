"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Plus, 
  Tag, 
  Users, 
  Percent, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Loader2,
  MoreHorizontal,
  Pencil,
  Ban
} from "lucide-react";
import { toast } from "sonner";

// --- Shadcn UI Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---
type Plan = {
  id: string;
  name: string;
  interval: string;
  userType: string;
};
type CouponFormPayload = {
  couponCode: string;
  description: string;
  type: Coupon["type"];
  discountPercentage: string | number;
  discountAmount: string | number;
  freeDays: string | number;
  applicableUserTypes: string[];
  applicablePlanIds: string[];
  applicableCurrencies: string[];
  firstCycleOnly: boolean;
  multiCycle: boolean;
  startDate: string;
  endDate: string;
  maxGlobalUses: string | number;
  maxUsesPerUser: number;
  autoApply: boolean;
  autoApplyConditions?: Record<string, unknown>;
};


type Coupon = {
  id: string;
  couponCode: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_DURATION" | "FULL_DISCOUNT" | "AUTO_APPLY";
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  discountPercentage?: number;
  discountAmount?: number;
  freeDays?: number;
  startDate: string;
  endDate: string;
  maxGlobalUses?: number;
  maxUsesPerUser?: number;
  firstCycleOnly?: boolean;
  multiCycle?: boolean;
  applicableUserTypes: string[];
  applicableCurrencies: string[];
  _count?: { redemptions: number };
  autoApply: boolean;
//   autoApplyConditions?: any;
  applicablePlans: Plan[];
  description?: string;
};

// --- API Helpers ---
const fetchCoupons = async () => {
  const response = await axios.get<Coupon[]>("/api/admin/coupons");
  return response.data;
};

const fetchPlans = async () => {
  const response = await axios.get<Plan[]>("/api/subscription-plans");
  return response.data;
};

const createCouponApi = async (data:CouponFormPayload) => {
  const response = await axios.post("/api/admin/coupons", data);
  return response.data;
};

const updateCouponApi = async ({ id, data }: { id: string; data: CouponFormPayload }) => {
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

  // --- Form State ---
 const initialFormState: CouponFormPayload = {
  couponCode: "",
  description: "",
  type: "PERCENTAGE", // now correctly inferred as a literal union type
  discountPercentage: "",
  discountAmount: "",
  freeDays: "",
  applicableUserTypes: ["ENTHUSIAST"],
  applicablePlanIds: [],
  applicableCurrencies: ["INR", "USD"],
  firstCycleOnly: false,
  multiCycle: false,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  maxGlobalUses: "",
  maxUsesPerUser: 1,
  autoApply: false,
  autoApplyConditions: {}, // FIXED: must be an object, not a string
};

  const [formData, setFormData] = useState<CouponFormPayload>(initialFormState);

  // --- React Query Hooks ---
  const { data: coupons = [], isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["coupons"],
    queryFn: fetchCoupons,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
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
    }
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
    }
  });

  const deleteMutation = useMutation({
  mutationFn: (id: string) => deleteCouponApi(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deactivated/deleted.");
    },
    onError: () => {
      toast.error("Could not delete coupon.");
    }
  });

  // --- Handlers ---
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    
    // Transform coupon data to form structure
    setFormData({
      couponCode: coupon.couponCode,
      description: coupon.description || "",
      type: coupon.type,
      discountPercentage: coupon.discountPercentage?.toString() || "",
      discountAmount: coupon.discountAmount?.toString() || "",
      freeDays: coupon.freeDays?.toString() || "",
      applicableUserTypes: coupon.applicableUserTypes,
      applicablePlanIds: coupon.applicablePlans.map(p => p.id),
      applicableCurrencies: coupon.applicableCurrencies,
      firstCycleOnly: coupon.firstCycleOnly || false,
      multiCycle: coupon.multiCycle || false,
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      maxGlobalUses: coupon.maxGlobalUses?.toString() || "",
      maxUsesPerUser: coupon.maxUsesPerUser || 1,
      autoApply: coupon.autoApply,
      autoApplyConditions:{},
    //   autoApplyConditions: JSON.stringify(coupon.autoApplyConditions || {}, null, 2),
    });
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure? Unused coupons will be deleted, used ones deactivated.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // JSON Validation
    // let parsedConditions = {};
    // try {
        // parsedConditions = JSON.parse(formData.autoApplyConditions);
    // } catch (e) {
    //     toast.error("Invalid JSON in Auto Apply logic.");
    //     return;
    // }

    const payload = {
        ...formData,
        // autoApplyConditions: parsedConditions
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

  const toggleSelection = (field: "applicablePlanIds" | "applicableCurrencies" | "applicableUserTypes", value: string) => {
    setFormData((prev) => {
        const current = prev[field] as string[];
        return current.includes(value)
            ? { ...prev, [field]: current.filter(item => item !== value) }
            : { ...prev, [field]: [...current, value] };
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8 space-y-8 bg-muted/30 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupons & Discounts</h1>
            <p className="text-muted-foreground mt-1">Manage trials, promotional codes, and auto-apply logic.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4" /> Create Coupon
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingId ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                    <DialogDescription>
                        {editingId ? "Modify existing discount rules." : "Configure discount rules, validity, and applicability."}
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Coupon Code</Label>
                            <Input 
                                placeholder="SUMMER2025" 
                                className="uppercase font-mono"
                                value={formData.couponCode}
                                onChange={(e) => handleInputChange("couponCode", e.target.value.toUpperCase())}
                                required
                                disabled={!!editingId} // Usually can't change code after creation
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select 
                                value={formData.type} 
                              onValueChange={(val: Coupon["type"]) => handleInputChange("type", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                                    <SelectItem value="FREE_DURATION">Free Trial Duration</SelectItem>
                                    <SelectItem value="FULL_DISCOUNT">100% Off</SelectItem>
                                    <SelectItem value="AUTO_APPLY">Auto Apply</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Internal Description</Label>
                        <Input 
                            placeholder="e.g. Special offer for Influencers" 
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                        />
                    </div>

                    {/* Value Configuration */}
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-6">
                                {formData.type === 'PERCENTAGE' && (
                                    <div className="space-y-2">
                                        <Label>Discount Percentage (%)</Label>
                                        <div className="relative">
                                            <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" className="pl-9" 
                                                value={formData.discountPercentage} 
                                                onChange={(e) => handleInputChange("discountPercentage", e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                )}
                                {formData.type === 'FIXED' && (
                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" className="pl-9" 
                                                value={formData.discountAmount} 
                                                onChange={(e) => handleInputChange("discountAmount", e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                )}
                                {(formData.type === 'FREE_DURATION' || formData.type === 'AUTO_APPLY') && (
                                    <div className="space-y-2">
                                        <Label>Free Days</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" className="pl-9" 
                                                value={formData.freeDays} 
                                                onChange={(e) => handleInputChange("freeDays", e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-6 mt-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="firstCycle" 
                                        checked={formData.firstCycleOnly}
                                        onCheckedChange={(checked) => handleInputChange("firstCycleOnly", checked === true)}
                                    />
                                    <Label htmlFor="firstCycle">First Cycle Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="multiCycle" 
                                        checked={formData.multiCycle}
                                        onCheckedChange={(checked) => handleInputChange("multiCycle", checked === true)}
                                    />
                                    <Label htmlFor="multiCycle">Multi-Cycle Renewal</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Applicability */}
                    <div className="space-y-3">
                        <Label>Applicable Plans</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {plans.map(plan => (
                                <div 
                                    key={plan.id}
                                    onClick={() => toggleSelection("applicablePlanIds", plan.id)}
                                    className={`
                                        cursor-pointer rounded-md border p-3 text-sm transition-all
                                        ${formData.applicablePlanIds.includes(plan.id) 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                            : "hover:bg-accent hover:text-accent-foreground"
                                        }
                                    `}
                                >
                                    <div className="font-medium">{plan.name}</div>
                                    <div className="text-xs text-muted-foreground">{plan.interval} • {plan.userType}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label>User Types</Label>
                            <div className="flex flex-col gap-2">
                                {["COACH", "ENTHUSIAST", "SOLOPRENEUR", "ALL"].map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox id={`user-${type}`} 
                                            checked={formData.applicableUserTypes.includes(type)}
                                            onCheckedChange={() => toggleSelection("applicableUserTypes", type)}
                                        />
                                        <Label htmlFor={`user-${type}`} className="cursor-pointer font-normal">{type}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label>Currency</Label>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="curr-inr" checked={formData.applicableCurrencies.includes("INR")} onCheckedChange={() => toggleSelection("applicableCurrencies", "INR")} />
                                    <Label htmlFor="curr-inr">INR</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="curr-usd" checked={formData.applicableCurrencies.includes("USD")} onCheckedChange={() => toggleSelection("applicableCurrencies", "USD")} />
                                    <Label htmlFor="curr-usd">USD</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={formData.startDate} onChange={(e) => handleInputChange("startDate", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={formData.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} required />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Max Global Uses</Label>
                            <Input type="number" placeholder="50" max={50} value={formData.maxGlobalUses} onChange={(e) => handleInputChange("maxGlobalUses", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Per User</Label>
                            <Input type="number" value={formData.maxUsesPerUser} onChange={(e) => handleInputChange("maxUsesPerUser", Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Auto Apply Logic */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Auto Apply Logic</Label>
                                <p className="text-sm text-muted-foreground">Automatically apply this coupon based on triggers.</p>
                            </div>
                            <Switch 
                                checked={formData.autoApply}
                                onCheckedChange={(checked) => handleInputChange("autoApply", checked)}
                            />
                        </div>
                        {/* {formData.autoApply && (
                            <div className="space-y-2">
                                <Label>Condition JSON</Label>
                                <Textarea 
                                    className="font-mono text-xs" 
                                    placeholder='{"country": "IN", "trigger": "SIGNUP"}'
                                    value={formData.autoApplyConditions}
                                    onChange={(e) => handleInputChange("autoApplyConditions", e.target.value)}
                                />
                            </div>
                        )} */}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? "Saving..." : (editingId ? "Update Coupon" : "Create Coupon")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
            <CardTitle>Active Coupons</CardTitle>
            <CardDescription>
                Viewing {coupons.length} coupons.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Redemptions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoadingCoupons ? (
                         <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading data...
                                </div>
                            </TableCell>
                         </TableRow>
                    ) : coupons.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                No coupons found. Create one to get started.
                            </TableCell>
                         </TableRow>
                    ) : coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                            <TableCell className="font-medium font-mono">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    {coupon.couponCode}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium capitalize">{coupon.type.replace('_', ' ').toLowerCase()}</span>
                                    {coupon.autoApply && (
                                        <span className="text-xs text-purple-600 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Auto
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    coupon.status === 'ACTIVE' ? 'default' : 
                                    coupon.status === 'EXPIRED' ? 'secondary' : 'destructive'
                                }>
                                    {coupon.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {coupon.discountPercentage && `${coupon.discountPercentage}%`}
                                {coupon.discountAmount && `Fixed Amount`}
                                {coupon.freeDays && `${coupon.freeDays} Days`}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {format(new Date(coupon.startDate), "MMM d, yyyy")} - <br/>
                                {format(new Date(coupon.endDate), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{coupon._count?.redemptions || 0}</span>
                                    <span className="text-muted-foreground text-xs">/ {coupon.maxGlobalUses || '∞'}</span>
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
                                        <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={() => handleDelete(coupon.id)} 
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            <Ban className="mr-2 h-4 w-4" /> Deactivate/Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}