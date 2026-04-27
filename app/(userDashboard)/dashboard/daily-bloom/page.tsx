import { Suspense } from "react";
import DailyBloomCLient from "@/components/DailyBloom/DailyBloomClient";
import PageLoader from "@/components/PageLoader";

export default async function DailyBloom() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <PageLoader />
        </div>
      }
    >
      <DailyBloomCLient />
    </Suspense>
  );
}
