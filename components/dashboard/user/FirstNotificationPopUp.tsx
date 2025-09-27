"use client";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import usePushNotifications from "@/hooks/usePushNotifications";

export default function FirstVisitNotificationPopup() {
  const {
    showFirstVisitPopup,
    handleFirstVisitAllow,
    setShowFirstVisitPopup,
    handleFirstVisitLater,
    isLoading,
  } = usePushNotifications();
  
  return (
    <Dialog open={showFirstVisitPopup} onOpenChange={(isOpen) => setShowFirstVisitPopup(isOpen)}>
      <DialogContent
        className="
           max-sm:max-w-xs sm:max-w-sm 
          p-4 sm:p-6
          rounded-lg
        "
      >
        <DialogHeader className="space-y-2">
           <DialogTitle
            className="text-base sm:text-lg font-semibold text-center sm:text-left">
      Enable Notifications
    </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
      Stay updated with real-time alerts. Enable browser notifications now.
    </DialogDescription>
        </DialogHeader>

        <DialogFooter
          className="
            flex flex-col sm:flex-row gap-2
            w-full
          "
        >
          <Button
            onClick={handleFirstVisitAllow}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Allow
          </Button>
          <Button
            variant="outline"
            onClick={handleFirstVisitLater}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
