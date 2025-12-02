"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; 
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

// --- Constants ---
const DEFAULT_GST_PERCENTAGE = 18;

// --- Types ---
interface Plan {
  id: string;
  name: string;
  amountINR: number;
  amountUSD: number;
  interval: "MONTHLY" | "YEARLY" | "LIFETIME";
  userType: "SOLOPRENEUR" | "ENTHUSIAST";
  isActive: boolean;
  description: string | null;
  gstEnabled: boolean;
  gstPercentage: number;
  createdAt: string;
  updatedAt: string;
}

type NewPlanData = Omit<Plan, "id" | "createdAt" | "updatedAt" | "isActive">;

// --- Helper ---
const formatCurrency = (amount: number, currency: "INR" | "USD") => {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

const MembershipPlans = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultFormData: NewPlanData = {
    name: "",
    amountINR: 0,
    amountUSD: 0,
    interval: "MONTHLY",
    userType: "SOLOPRENEUR",
    description: "",
    gstEnabled: false,
    gstPercentage: 0,
  };

  const [formData, setFormData] = useState<NewPlanData>(defaultFormData);

  // 1. Fetch Plans
  const { data: plans, isLoading, error } = useQuery<Plan[]>({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const res = await axios.get(`/api/subscription-plans`);
      return res.data;
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  // 2. Create Plan
  const createPlanMutation = useMutation({
    mutationFn: async (newPlan: NewPlanData) => {
      const payload = {
        plan_name: newPlan.name,
        user_type: newPlan.userType,
        billing_cycle: newPlan.interval,
        amountINR: Number(newPlan.amountINR),
        amountUSD: Number(newPlan.amountUSD),
        description: newPlan.description,
        gstEnabled: newPlan.gstEnabled,
        gstPercentage: newPlan.gstEnabled ? Number(newPlan.gstPercentage) : 0,
      };
      const response = await axios.post("/api/subscription-plans", payload);
      return response.data;
    },
    onSuccess: (newPlan: Plan) => {
      queryClient.setQueryData<Plan[]>(["membership-plans"], (oldData) => {
        return oldData ? [...oldData, newPlan] : [newPlan];
      });
      toast.success("Plan created successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to create plan."),
  });

  // 3. Update Plan
  const updatePlanMutation = useMutation({
    mutationFn: async (data: { id: string; plan: NewPlanData }) => {
      const payload = {
        id: data.id,
        plan_name: data.plan.name,
        user_type: data.plan.userType,
        billing_cycle: data.plan.interval,
        amountINR: Number(data.plan.amountINR),
        amountUSD: Number(data.plan.amountUSD),
        description: data.plan.description,
        gstEnabled: data.plan.gstEnabled,
        gstPercentage: data.plan.gstEnabled ? Number(data.plan.gstPercentage) : 0,
      };
      const response = await axios.patch("/api/subscription-plans", payload);
      return response.data;
    },
    onSuccess: (updatedPlan: Plan) => {
      queryClient.setQueryData<Plan[]>(["membership-plans"], (oldData) => {
        if (!oldData) return [updatedPlan];
        return oldData.map((plan) =>
          plan.id === updatedPlan.id ? updatedPlan : plan
        );
      });
      toast.success("Plan updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update plan."),
  });

  // 4. Toggle GST
  const toggleGstMutation = useMutation({
    mutationFn: async (data: { id: string; gstEnabled: boolean }) => {
      const response = await axios.patch("/api/subscription-plans/toggle-gst", data);
      return response.data;
    },
    onSuccess: (updatedPlan: Plan) => {
      queryClient.setQueryData<Plan[]>(["membership-plans"], (oldData) => {
        if (!oldData) return [updatedPlan];
        return oldData.map((plan) =>
          plan.id === updatedPlan.id ? updatedPlan : plan
        );
      });
      toast.success(`GST ${updatedPlan.gstEnabled ? "enabled" : "disabled"}`);
    },
    onError: () => toast.error("Failed to toggle GST."),
  });

  // 5. Toggle Activation
  const toggleActivationMutation = useMutation({
     mutationFn: async (data: { id: string; activeStatus: boolean }) => {
        const response = await axios.patch("/api/subscription-plans/toggle-activation", data);
        return response.data;
     },
     onSuccess: (updatedPlan: Plan) => {
        queryClient.setQueryData<Plan[]>(["membership-plans"], (oldData) => {
           if (!oldData) return [updatedPlan];
           return oldData.map((plan) => plan.id === updatedPlan.id ? updatedPlan : plan);
        });
        toast.success(`Plan ${updatedPlan.isActive ? "activated" : "deactivated"}`);
     },
     onError: () => toast.error("Failed to toggle activation.")
  });

  const handleEditClick = (plan: Plan) => {
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      amountINR: plan.amountINR,
      amountUSD: plan.amountUSD,
      interval: plan.interval,
      userType: plan.userType,
      description: plan.description || "",
      gstEnabled: plan.gstEnabled || false,
      gstPercentage: plan.gstPercentage || 0,
    });
    setIsDialogOpen(true);
  };

  const handleGstToggleFromTable = (plan: Plan, isEnabled: boolean) => {
    toggleGstMutation.mutate({ id: plan.id, gstEnabled: isEnabled });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    setIsDialogOpen(open);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePlanMutation.mutate({ id: editingId, plan: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const isPending = createPlanMutation.isPending || updatePlanMutation.isPending;
  const isTableActionPending = toggleGstMutation.isPending || toggleActivationMutation.isPending;

  if (error) return <div className="text-red-500 p-4">Error loading plans.</div>;

  return (
    <div className="sm:container sm:mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Membership Plans</h2>
          <p className="text-muted-foreground">
            Manage pricing tiers for Coaches, Solopreneurs, and Enthusiasts.
          </p>
        </div>

        {/* --- DIALOG --- */}
        <div className="flex flex-col sm:flex-row gap-2">

        <Button variant='outline'>
          <Link href="/admin/coupons">Coupons Management</Link>
          </Button>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" /> Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Membership Plan" : "Create Membership Plan"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Update the details below." : "Add a new pricing tier."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1 w-full">
                {/* Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right font-medium">
                    Plan Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Monthly Coach"
                    className="col-span-3"
                    required
                  />
                </div>

                {/* User Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userType" className="text-right font-medium">
                    User Type
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.userType}
                      onValueChange={(val: any) =>
                        setFormData((prev) => ({ ...prev, userType: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLOPRENEUR">Coach / Solopreneur</SelectItem>
                        <SelectItem value="ENTHUSIAST">Self-Growth Enthusiast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Interval */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interval" className="text-right font-medium">
                    Billing Cycle
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.interval}
                      onValueChange={(val: any) =>
                        setFormData((prev) => ({ ...prev, interval: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                        <SelectItem value="LIFETIME">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price INR */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amountINR" className="text-right font-medium">
                    Price (INR)
                  </Label>
                  <Input
                    id="amountINR"
                    name="amountINR"
                    type="number"
                    value={formData.amountINR}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    min="0"
                  />
                </div>

                {/* Price USD */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amountUSD" className="text-right font-medium">
                    Price (USD)
                  </Label>
                  <Input
                    id="amountUSD"
                    name="amountUSD"
                    type="number"
                    value={formData.amountUSD}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* GST Toggle in Dialog */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gstEnabled" className="text-right font-medium">
                    Enable GST
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="gstEnabled"
                      checked={formData.gstEnabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ 
                          ...prev, 
                          gstEnabled: checked,
                          gstPercentage: checked && prev.gstPercentage === 0 ? DEFAULT_GST_PERCENTAGE : prev.gstPercentage
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.gstEnabled ? "GST Added" : "No GST"}
                    </span>
                  </div>
                </div>

                {/* GST Percentage Input */}
                {formData.gstEnabled && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gstPercentage" className="text-right font-medium">
                      GST %
                    </Label>
                    <div className="col-span-3 relative">
                      <Input
                        id="gstPercentage"
                        name="gstPercentage"
                        type="number"
                        value={formData.gstPercentage}
                        onChange={handleInputChange}
                        required={formData.gstEnabled}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g. 18"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right font-medium pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Optional details..."
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending ? "Saving..." : editingId ? "Update Plan" : "Save Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Plans</CardTitle>
          <CardDescription>
            A list of all membership plans currently configured in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Plan Name</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Total (INR)</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>Tax (GST)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => {
                  
                  // --- CALCULATION LOGIC ---
                  const taxAmount = plan.gstEnabled 
                    ? (plan.amountINR * (plan.gstPercentage / 100)) 
                    : 0;
                  const finalPriceINR = plan.amountINR + taxAmount;

                  return (
                    <TableRow
                      key={plan.id}
                      className={`${!plan.isActive ? "bg-red-50 hover:bg-red-100" : ""} rounded-sm`}
                    >
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant={plan.userType === "SOLOPRENEUR" ? "default" : "secondary"}>
                          {plan.userType === "SOLOPRENEUR" ? "Coach" : "Enthusiast"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">{plan.interval}</Badge></TableCell>
                      
                      {/* --- INR COLUMN (SHOW TOTAL) --- */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {formatCurrency(finalPriceINR, "INR")}
                          </span>
                          {plan.gstEnabled && (
                            <span className="text-[12px] text-muted-foreground">
                              {formatCurrency(plan.amountINR, "INR")} + {plan.gstPercentage}% Tax
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{formatCurrency(plan.amountUSD, "USD")}</TableCell>
                      
                      {/* --- GST TOGGLE COLUMN --- */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.gstEnabled}
                            onCheckedChange={(checked) => handleGstToggleFromTable(plan, checked)}
                            disabled={isTableActionPending}
                          />
                           {plan.gstEnabled ? (
                            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 ml-1">
                              {plan.gstPercentage}%
                            </Badge>
                          ) : (
                             <span className="text-xs text-muted-foreground ml-1">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {plan.isActive ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isTableActionPending}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(plan)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActivationMutation.mutate({ id: plan.id, activeStatus: !plan.isActive })}
                              className={plan.isActive ? "text-red-600" : "text-green-600"}
                              disabled={isTableActionPending}
                            >
                              {plan.isActive ? (
                                <><Trash2 className="mr-2 h-4 w-4" /> Deactivate</>
                              ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4" /> Activate</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipPlans;