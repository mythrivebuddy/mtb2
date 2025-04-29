import React from "react";
import Navbar from "../navbars/navbar/Navbar";

// ? probaly should be named public layout

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4] py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-[1280px] mx-auto">
        <div className="md:bg-white/55 backdrop-blur-sm rounded-[32px] p-4 sm:p-6 md:p-8">
          <Navbar />
          {children}
        </div>
      </div>
    </main>
  );
};

export default AppLayout;
