"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import CouponFormFields from "./CouponFormFields";
import { Challenge, CouponFormPayload, MmpProgram, StoreProduct } from "@/app/(userDashboard)/dashboard/(coach)/coupons/page";


type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  formData: CouponFormPayload;
  setFormData: React.Dispatch<React.SetStateAction<CouponFormPayload>>;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  challenges?: Challenge[];
  mmpPrograms?: MmpProgram[];
  storeProducts?: StoreProduct[];
  editingId?: string | null;
  onClose:()=>void
};

export default function CouponDialog({
  open,
  setOpen,
  formData,
  setFormData,
  onSubmit,
  onClose,
  isSaving,
  challenges = [],
  mmpPrograms = [],
  storeProducts = [],
  editingId,
}: Props) {
  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
        // Delay reset until after close animation (~200ms)
        setTimeout(() => {
            onClose();
        }, 200);
    }
};


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          <DialogDescription>
            {editingId
              ? "Modify existing discount rules."
              : "Configure discount rules, validity, and applicability."}
          </DialogDescription>
        </DialogHeader>

        <CouponFormFields
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          isSaving={isSaving}
          challenges={challenges}
          mmpPrograms={mmpPrograms}
          storeProducts={storeProducts}
          editingId={editingId}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}