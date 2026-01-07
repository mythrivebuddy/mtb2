import { Loader2 } from "lucide-react";

export default function loading() {
  return (
    <div className="w-full min-h-screen bg-dashboard flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
    </div>
  );
}
