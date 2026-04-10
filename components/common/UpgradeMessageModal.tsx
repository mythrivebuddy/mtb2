import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { AlertDialogHeader } from "../ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

export default function UpgradeMessageModal({
  isOpen,
  onClose,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  redirectToPricingUrl?: string;
}) {
  const router = useRouter();
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-sm:max-w-xs sm:max-w-sm rounded-sm">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-2">
            {message}
          </DialogDescription>
        </AlertDialogHeader>

        <div className="!flex !flex-col gap-2">
          <Button onClick={onClose} className="bg-red-600  hover:bg-red-700 ">
            Continue with Free Plan
          </Button>
          <Button
            onClick={() => router.push("/dashboard/subscription")}
            className="bg-green-700 hover:bg-green-800"
          >
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
