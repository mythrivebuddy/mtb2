"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type Props = {
    open: boolean;
    setOpen: (v: boolean) => void;
    onConfirm: () => void;
    isLoading: boolean;
};

export default function DeleteCouponDialog({
    open,
    setOpen,
    onConfirm,
    isLoading,
}: Props) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={(v) => {
                if (!isLoading) setOpen(v);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete / Deactivate Coupon</AlertDialogTitle>
                    <AlertDialogDescription>
                        If this coupon has already been used, it will be <b>deactivated</b>.
                        If it has never been used, it will be <b>deleted permanently</b>.
                        <br />
                        <br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Processing..." : "Yes, Continue"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}