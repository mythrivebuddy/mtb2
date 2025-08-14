"use client";


import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
export default function useRedirectDashboard() {
      const session = useSession();
      const router = useRouter();
      const url = typeof window !== "undefined" ? window.location.href : "";
      useEffect(()=>{
        if (session.status ==="unauthenticated") {
            return;
        }
          if(session.status ==="authenticated" && url === window.location.origin + "/") {            
                router.push("/dashboard");         
            }
    },[session.status]);
      return null;
}