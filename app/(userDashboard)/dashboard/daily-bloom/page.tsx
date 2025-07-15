import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import DailyBloomCLient from "@/components/DailyBloom/DailyBloomClient";



export default async function DailyBloom() {


  return (
    <Suspense
      fallback={
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your Daily Blooms...</span>
          </div>
      }
    >
      <DailyBloomCLient />
    </Suspense>
  );
}
