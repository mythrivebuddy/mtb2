"use client";

import React from "react";
import Image from "next/image";
import { Search } from "lucide-react";

const DashboardCenter: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50 p-6">
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between">
        {/* Search Input */}
      </div>

      {/* Main Content Split into Left (Dashboard) and Right (Buddies/History) */}
      <div className="flex gap-4">
        {/* Left Column */}
        <div className="w-2/3">
          {/* Dashboard Heading */}
          <div className="mb-4 flex justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <div className="relative w-1/2">
              <input
                type="text"
                placeholder="Search Anything Here..."
                className="
              w-full rounded-full border border-gray-300 
              px-4 py-2 pr-10 
              text-sm 
              focus:outline-none
            "
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* JP Stats Cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-gray-800">1000</p>
              <p className="text-sm text-gray-500">Total JP Earned</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-gray-800">750</p>
              <p className="text-sm text-gray-500">Total Spend JP</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-gray-800">750</p>
              <p className="text-sm text-gray-500">JP Balance</p>
            </div>
          </div>

          {/* Spotlight and Prosperity Sections */}
          <div className="grid grid-cols-2 gap-4">
            {/* Spotlight */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Spotlight
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">Applied</p>
                  <p className="text-xs text-gray-400">Under assessment</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">In Review</p>
                  <p className="text-xs text-gray-400">Wait for a while</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">Approved</p>
                  <p className="text-xs text-gray-400">Approved text</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">
                    Disapproved
                  </p>
                  <p className="text-xs text-gray-400">Reason here</p>
                </div>
              </div>
            </div>

            {/* Prosperity */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Prosperity
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">Applied</p>
                  <p className="text-xs text-gray-400">Under assessment</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">In Review</p>
                  <p className="text-xs text-gray-400">Wait for a while</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">Approved</p>
                  <p className="text-xs text-gray-400">Approved text</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-2">
                  <p className="text-sm font-medium text-gray-700">
                    Disapproved
                  </p>
                  <p className="text-xs text-gray-400">Reason here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCenter;
