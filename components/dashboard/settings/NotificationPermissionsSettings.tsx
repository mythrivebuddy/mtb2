"use client";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BellRing } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { toast } from "sonner";

/* --------------------------------------------------
   ✅ TYPES (NO ANY)
-------------------------------------------------- */
type NotificationItem = {
  id: string;
  name: string;
  title: string;
  notification_type: string;
  enabled?: boolean;
};

type FeatureGroup = {
  groupName: string;
  items: NotificationItem[];
};

type ApiResponse = {
  feature: FeatureGroup[];
  system: NotificationItem[];
  others: NotificationItem[];
};

/* --------------------------------------------------
   COMPONENT
-------------------------------------------------- */
export default function NotificationPermissionsSettings() {
  const qc = useQueryClient();

  /* ---------------------------------------
     FETCH
  --------------------------------------- */
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const res = await axios.get("/api/user/notification-permission-settings");
      return res.data.data;
    },
  });

  /* ---------------------------------------
     SINGLE MUTATION (PATCH)
  --------------------------------------- */
 const { mutate, isPending } = useMutation({
  mutationFn: ({ type, enabled }: { type: string; enabled: boolean }) =>
    axios.patch("/api/user/notification-permission-settings", {
      type,
      enabled,
    }),

  /* ✅ OPTIMISTIC UPDATE (same as bulk) */
  onMutate: async ({ type, enabled }) => {
    await qc.cancelQueries({ queryKey: ["notification-settings"] });

    const prev = qc.getQueryData<ApiResponse>([
      "notification-settings",
    ]);

    if (!prev) return;

    const update = (item: NotificationItem) =>
      item.notification_type === type
        ? { ...item, enabled }
        : item;

    qc.setQueryData<ApiResponse>(["notification-settings"], {
      ...prev,
      system: prev.system.map(update),
      others: prev.others.map(update),
      feature: prev.feature.map((g) => ({
        ...g,
        items: g.items.map(update),
      })),
    });

    return { prev };
  },

  onSuccess: () => {
    toast.success("Notification preference updated");
  },

  onError: (_err, _vars, ctx) => {
    toast.error("Failed to update preference");

    if (ctx?.prev) {
      qc.setQueryData(["notification-settings"], ctx.prev);
    }
  },

  /* ❌ REMOVE invalidateQueries */
});

  /* ---------------------------------------
     BULK MUTATION (PUT)  ✅ NEW
  --------------------------------------- */
 const bulkMutate = useMutation({
  mutationFn: ({
    types,
    enabled,
  }: {
    types: string[];
    enabled: boolean;
  }) =>
    axios.put("/api/user/notification-permission-settings", {
      types,
      enabled,
    }),

  onMutate: async ({ types, enabled }) => {
    await qc.cancelQueries({ queryKey: ["notification-settings"] });

    const prev = qc.getQueryData<ApiResponse>([
      "notification-settings",
    ]);

    if (!prev) return;

    const update = (item: NotificationItem) =>
      types.includes(item.notification_type)
        ? { ...item, enabled }
        : item;

    qc.setQueryData<ApiResponse>(["notification-settings"], {
      ...prev,
      system: prev.system.map(update),
      others: prev.others.map(update),
      feature: prev.feature.map((g) => ({
        ...g,
        items: g.items.map(update),
      })),
    });

    return { prev };
  },
   onSuccess: () => {
    toast.success("Notification preference updated");
  },
  onError: (_err, _vars, ctx) => {
    if (ctx?.prev) {
      qc.setQueryData(["notification-settings"], ctx.prev);
    }
  },

});

  /* ---------------------------------------
     LOADING UI
  --------------------------------------- */
  if (isLoading || !data) {
    return (
      <div className=" mx-auto p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  /* ---------------------------------------
     HELPERS FOR MASTER TOGGLES
  --------------------------------------- */
  const systemItems = data.system || [];
  const othersItems = data.others || [];
  const featureItems = data.feature?.flatMap((g) => g.items) || [];

  const allItems = [...systemItems, ...featureItems, ...othersItems];

  const isGlobalEnabled =
    allItems.length > 0 && allItems.every((i) => i.enabled !== false);
  const isSystemEnabled =
    systemItems.length > 0 && systemItems.every((i) => i.enabled !== false);
  const isOthersEnabled =
    othersItems.length > 0 && othersItems.every((i) => i.enabled !== false);
  const isFeatureEnabled =
    featureItems.length > 0 && featureItems.every((i) => i.enabled !== false);

  /* ---------------------------------------
     BULK TOGGLE (FIXED)
  --------------------------------------- */
  const toggleItems = (items: NotificationItem[], checked: boolean) => {
    const typesToUpdate = items
      .filter((item) => (item.enabled !== false) !== checked)
      .map((item) => item.notification_type);

    if (typesToUpdate.length === 0) return;

    bulkMutate.mutate({
      types: typesToUpdate,
      enabled: checked,
    });
  };

  /* ---------------------------------------
     RENDER REUSABLE ITEM LIST (CHILDREN)
  --------------------------------------- */
  const renderItemsList = (items: NotificationItem[]) => (
    <div className="space-y-4">
      {items.map((item: NotificationItem, index: number) => (
        <div key={item.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.title}</p>
            </div>
            <Switch
              disabled={isPending || bulkMutate.isPending}
              checked={item.enabled !== false}
              onCheckedChange={(checked: boolean) => {
                const isCurrent = item.enabled !== false;
                if (isCurrent === checked) return;

                mutate({
                  type: item.notification_type,
                  enabled: checked,
                });
              }}
            />
          </div>
          {index !== items.length - 1 && <Separator className="mt-3" />}
        </div>
      ))}
    </div>
  );

  /* ---------------------------------------
     FINAL UI (UNCHANGED)
  --------------------------------------- */
  return (
    <div className=" mx-auto  space-y-6">
      {/* GLOBAL */}
      <Card className="relative overflow-hidden border border-border/40 bg-card shadow-none">
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-l bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700" />

        <CardHeader className="flex flex-row items-center justify-between gap-4 py-5 pl-6 pr-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border/40 bg-muted text-blue-500 dark:text-blue-400">
              <BellRing className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium leading-none text-foreground">
                  Master toggle
                </CardTitle>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    isGlobalEnabled
                      ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "border-border/40 bg-muted text-muted-foreground",
                  )}
                >
                  {isGlobalEnabled ? "On" : "Off"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Turn all system, feature, and other notifications on or off
                instantly.
              </p>
            </div>
          </div>

          <Switch
            disabled={isPending || bulkMutate.isPending}
            checked={isGlobalEnabled}
            onCheckedChange={(checked) => toggleItems(allItems, checked)}
          />
        </CardHeader>
      </Card>

      {/* SYSTEM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
          <CardTitle className="text-base">System Notifications</CardTitle>
          <Switch
            disabled={isPending || bulkMutate.isPending}
            checked={isSystemEnabled}
            onCheckedChange={(checked) => toggleItems(systemItems, checked)}
          />
        </CardHeader>
        <CardContent className="pt-6">
          {renderItemsList(systemItems)}
        </CardContent>
      </Card>

      {/* FEATURE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
          <CardTitle className="text-base">Feature Notifications</CardTitle>
          <Switch
            disabled={isPending || bulkMutate.isPending}
            checked={isFeatureEnabled}
            onCheckedChange={(checked) => toggleItems(featureItems, checked)}
          />
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {data.feature.map((group, groupIndex) => (
            <div key={group.groupName} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {group.groupName}
              </h3>
              {renderItemsList(group.items)}
              {groupIndex !== data.feature.length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* OTHERS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
          <CardTitle className="text-base">Other Notifications</CardTitle>
          <Switch
            disabled={isPending || bulkMutate.isPending}
            checked={isOthersEnabled}
            onCheckedChange={(checked) => toggleItems(othersItems, checked)}
          />
        </CardHeader>
        <CardContent className="pt-6">
          {renderItemsList(othersItems)}
        </CardContent>
      </Card>
    </div>
  );
}