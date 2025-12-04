"use client";
import React from "react";
import Navbar from "../navbars/navbar/Navbar";
import AnnouncementBanner from "../AnnouncementBanner";
import Footer from "@/app/new-home/_components/Footer";


const AppLayout = ({ children }: { children: React.ReactNode }) => {
 

  return (
    <main className="min-h-screen py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-white rounded-[32px] p-4 sm:p-6 md:p-8">
          <Navbar />
          <AnnouncementBanner/>
          {children}
          <div className="p-0">
          <Footer/>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AppLayout;
