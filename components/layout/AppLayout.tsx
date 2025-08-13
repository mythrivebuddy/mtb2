"use client";
import React from "react";
import Navbar from "../navbars/navbar/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ? probaly should be named public layout

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const router = useRouter();
  const url = typeof window !== "undefined" ? window.location.href : "";
  if(session.status ==="authenticated"){
    if(url === window.location.origin + "/"){
      router.push("/dashboard");
    }
  }
  return (
    <main className="min-h-screen py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-white rounded-[32px] p-4 sm:p-6 md:p-8">
          <Navbar />
          {children}
        </div>
      </div>
    </main>
  );
};

export default AppLayout;
