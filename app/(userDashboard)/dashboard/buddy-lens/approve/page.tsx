
import BuddyLensApprovePage from "@/components/buddy-lens/ApproveRequets";
import { Suspense } from "react";

export default function Approve() {
  return(
    <Suspense>
      fallback={
        <BuddyLensApprovePage/>
      }
    </Suspense>
  )
}
