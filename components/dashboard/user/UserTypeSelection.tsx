"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, UsersRound } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function UserTypeSelection({
  authMethod,
}: {
  authMethod: string;
}) {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<null | "COACH" | "ENTHUSIAST">(null);

  // Show popup only when Google user AND userType is null
  useEffect(() => {
    if (authMethod === "GOOGLE" && !user?.userType) {
      setOpen(true);
    }
  }, [user]);

  const handleSelect = async (role: "COACH" | "ENTHUSIAST") => {
    try {
      setLoading(role);

      const res = await axios.post("/api/user/set-user-type", { role });

      if (res.status === 200) {
        await update({
            userType: role,        
        });

        toast.success(res.data.message);
        setOpen(false);
        return;
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while saving your role.");
      setLoading(null);
    }
  };

  // If user already has userType OR not a Google login → Hide dialog
  if (!(authMethod === "GOOGLE" && !user?.userType)) {
    return null;
  }

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-xs sm:max-w-md rounded-2xl p-6  shadow-xl border border-slate-200"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-slate-800">
            Welcome to Your Growth Journey
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 mt-2">
            You signed in with Google. Before we personalize your dashboard,
            tell us what best describes you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 mt-6">
          {/* Enthusiast Button */}
          <button
            onClick={() => handleSelect("ENTHUSIAST")}
            disabled={loading !== null}
            className="w-full rounded-xl bg-indigo-600 text-white px-5 py-4 font-semibold 
            hover:bg-indigo-700 transition flex items-center justify-center gap-3 
            shadow-md disabled:opacity-60"
          >
            {loading === "ENTHUSIAST" ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Self Growth Enthusiast
              </>
            )}
          </button>

          {/* Coach Button */}
          <button
            onClick={() => handleSelect("COACH")}
            disabled={loading !== null}
            className="w-full rounded-xl bg-slate-100 text-slate-800 px-5 py-4 font-semibold 
            hover:bg-slate-200 transition flex items-center justify-center gap-3 
            shadow-sm border border-slate-300 disabled:opacity-60"
          >
            {loading === "COACH" ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <UsersRound className="h-5 w-5" />
                Coach / Solopreneur
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Your selection helps us tailor recommendations and features for you.
        </p>
      </DialogContent>
    </Dialog>
  );
}
