import { Loader2 } from "lucide-react";

export default function Loading(){

    return (
        <main className="h-screen w-screen flex items-center justify-center">
            <Loader2 size={36} className="animate-spin" />
        </main>
    )
}