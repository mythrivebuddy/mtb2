import AppLayout from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

export default function loading() {
  return (
    <AppLayout>
      <div className="h-screen flex justify-center items-center">
        <Loader2 size={36} className="animate-spin"/>
      </div>
    </AppLayout>
  )
}
