"use client";

import { useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SignaturePadDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const padRef = useRef<SignaturePad>(null);

  const handleSave = () => {
    if (!padRef.current) return;
   const dataUrl = padRef.current.getCanvas().toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  };

  const handleClear = () => {
    padRef.current?.clear();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sign Your Signature</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <SignaturePad
            ref={padRef}
            penColor="#000"
            canvasProps={{
              width: 450,
              height: 200,
              className: "border rounded-md bg-white",
            }}
          />

          <div className="flex gap-4 pt-3">
            <Button variant="secondary" onClick={handleClear}>Clear</Button>
            <Button   onClick={handleSave}>Save Signature</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
