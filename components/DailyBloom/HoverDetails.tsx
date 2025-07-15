import {
  Calendar as CalendarIcon,
  Repeat,
} from "lucide-react";
import { format } from "date-fns";
import { DailyBloomFormType } from "@/schema/zodSchema";

interface DailyBloom extends DailyBloomFormType {
  id: string;
}

interface HoverDetailsProps {
  bloom: DailyBloom;
}

export default function HoverDetails({ bloom }: HoverDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {/* ✅ FIX: Using break-all for guaranteed wrapping */}
        <h4 className="text-sm font-semibold break-all">{bloom.title}</h4>
        {/* ✅ FIX: Using break-all for guaranteed wrapping */}
        <p className="text-sm text-muted-foreground break-all">
          {bloom.description || "No description provided."}
        </p>
      </div>
      <div className="flex items-center pt-2">
        {bloom.dueDate && (
          <>
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-xs text-muted-foreground">
              Due on {format(new Date(bloom.dueDate), "PPP")}
            </span>
          </>
        )}
        {bloom.frequency && (
          <>
            <Repeat className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-xs text-muted-foreground">
              Repeats {bloom.frequency}
            </span>
          </>
        )}
      </div>
    </div>
  );
}