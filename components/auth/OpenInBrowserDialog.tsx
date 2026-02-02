"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function OpenInBrowserDialog({
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] mx-2 sm:mx-0 rounded-lg">
        <DialogHeader>
          <DialogTitle>Google Sign-In Security</DialogTitle>
          <DialogDescription>
            Google Sign-In may not work inside in-app browsers. Use the{" "}
            <strong>⋮ menu → Open in Chrome</strong> to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <a
            href="/signin"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full" onClick={onConfirm}>
              Open in Browser
            </Button>
          </a>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
