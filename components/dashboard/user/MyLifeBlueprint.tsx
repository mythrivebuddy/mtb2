"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AREA_ICON_MAP } from "@/lib/utils/makeover-program/makeover-icons";
import { useRouter } from "next/navigation";

type Commitment = {
  id: string;
  goalText: string | null;
  identityText: string | null;
  visionStatement: string | null;
  area?: {
    id: number;
    name: string;
  };
};

const areaColorMap: Record<number, string> = {
  1: "text-red-500",
  2: "text-purple-600",
  3: "text-blue-600",
  4: "text-orange-600",
  5: "text-emerald-600",
  6: "text-pink-600",
  7: "text-yellow-600",
  8: "text-indigo-600",
  9: "text-green-600",
};

export default function MyLifeBlueprint({
  data,
  cmpProgramId,
}: {
  data: Commitment[];
  cmpProgramId?: string;
}) {
  const isEmpty = !data?.length;
  const router = useRouter();
  console.log({ cmpProgramId });

  return (
    <div className="mb-6">
      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <h2 className="text-xl font-semibold text-foreground mb-4">
            My Life Blueprint
          </h2>
          {isEmpty && (
            <Button
              onClick={() =>
                router.push(
                  `/dashboard/complete-makeover-program/onboarding?planId=${cmpProgramId}`,
                )
              }
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              Set Life Blueprint
            </Button>
          )}
          {/* Grid Section */}
          {!isEmpty && (
            <div className="rounded-xl border bg-background overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch">
                {data.map((item, index) => {
                  const Icon =
                    AREA_ICON_MAP[item.area?.id || 0] || AREA_ICON_MAP[9]; // fallback

                  const color = areaColorMap[item.area?.id || 9];

                  return (
                    <div key={item.id} className="h-full">
                      {/* Card Item */}
                      <div className="relative p-4 h-full flex flex-col">
                        {/* Vertical Divider (desktop only) */}
                        {index !== data.length - 1 && (
                          <div className="hidden sm:block absolute right-0 top-4 bottom-4 w-px bg-border" />
                        )}

                        {/* Area */}
                        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                          <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                          <span className={`${color} break-words`}>
                            {item.area?.name}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-2 flex-1">
                          {/* Goal */}
                          <p className="text-sm font-medium text-foreground leading-snug break-words">
                            {item.goalText}
                          </p>

                          {/* Identity */}
                          <p className="text-xs text-muted-foreground leading-relaxed break-words">
                            {item.identityText}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Separator */}
                      {index !== data.length - 1 && (
                        <Separator className="sm:hidden" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <Separator className="my-4" />

          {/* Vision Section */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Vision Statement
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {isEmpty
                ? "Your vision statement comes here.. Create a compelling vision in your life blueprint. The vision that makes you unstoppable. It’s your North Star that keeps you moving in the right direction"
                : data[0]?.visionStatement}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
