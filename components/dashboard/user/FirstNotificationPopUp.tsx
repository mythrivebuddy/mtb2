"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import usePushNotifications from "@/hooks/usePushNotifications";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface FirstVisitNotificationPopupProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAllow?: () => Promise<void>;
  onLater?: () => void;
  isLoading?: boolean;
}

export default function FirstVisitNotificationPopup(
  props?: FirstVisitNotificationPopupProps,
) {
  const hookState = usePushNotifications();
  const [allowLoading, setAllowLoading] = useState(false);
  // ✅ Use props if provided, otherwise use hook
  const showFirstVisitPopup = props?.open ?? hookState.showFirstVisitPopup;
  const setShowFirstVisitPopup =
    props?.onOpenChange ?? hookState.setShowFirstVisitPopup;
  const handleFirstVisitAllow =
    props?.onAllow ?? hookState.handleFirstVisitAllow;
  const handleFirstVisitLater =
    props?.onLater ?? hookState.handleFirstVisitLater;
  const isLoading = props?.isLoading ?? hookState.isLoading;

  const handleAllowClick = async () => {
    setAllowLoading(true);
    try {
      await handleFirstVisitAllow();
   
    } finally {
        setShowFirstVisitPopup(false); // ✅ Close AFTER success
      setAllowLoading(false);
    }
  };
  const handleLaterClick = () => {
    setShowFirstVisitPopup(false); // ✅ Close instantly
    handleFirstVisitLater();
  };

  return (
    <Dialog
      open={showFirstVisitPopup}
      onOpenChange={(isOpen) => {
        // ✅ CHANGE: Only allow closing if explicitly calling
        if (!isOpen && !allowLoading) {
          setShowFirstVisitPopup(false);
        }
      }}
    >
      <DialogContent
        className="
           max-sm:max-w-xs sm:max-w-sm 
          p-4 sm:p-6
          rounded-lg
          [&>button]:hidden
        "
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg font-semibold text-center sm:text-left">
            Enable Notifications
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Stay updated with real-time alerts. Enable browser notifications
            now.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter
          className="
            flex flex-col sm:flex-row gap-2
            w-full
          "
        >
          <Button
            onClick={handleAllowClick}
            disabled={isLoading || allowLoading}
            className="flex items-center    dark:text-black"
          >
            {allowLoading ? (
              <>
                Allowing...
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              </>
            ) : (
              "Allow"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleLaterClick} // ✅ CHANGE
            disabled={allowLoading}
            className="w-full sm:w-auto"
          >
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
