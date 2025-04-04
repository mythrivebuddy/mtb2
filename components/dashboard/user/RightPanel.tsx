"use client";

import React from "react";

type Buddy = {
  id: number;
  name: string;
  access: string;
  avatar?: string;
};

type HistoryItem = {
  id: number;
  description: string;
  date: string;
  amount: number;
};

const RightPanel = ({ className }: { className?: string }) => {
  const buddies: Buddy[] = [
    { id: 1, name: "Alice", access: "Full Access" },
    { id: 2, name: "Bob", access: "Limited Access" },
    { id: 3, name: "Charlie", access: "Full Access" },
  ];

  const historyItems: HistoryItem[] = [
    {
      id: 1,
      description: "Spend on Spotlight",
      date: "February 1, 2025",
      amount: 750,
    },
    {
      id: 2,
      description: "Spend on Prosperity",
      date: "February 1, 2025",
      amount: 750,
    },
    {
      id: 3,
      description: "Updated profile",
      date: "February 1, 2025",
      amount: 750,
    },
    {
      id: 4,
      description: "Earned Jp for Login",
      date: "Jan 31, 2025",
      amount: 50,
    },
  ];

  return (
    <div className={`bg-transparent overflow-y-auto ${className}`}>
      {/* Buddies Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">Buddies</h2>
          <a
            href="#"
            className="text-sm text-blue-500 hover:text-gray-700 hover:underline"
          >
            View all
          </a>
        </div>
        <div className="space-y-3 bg-white rounded-3xl p-5">
          {buddies?.map((buddy) => (
            <div key={buddy.id} className="flex items-center">
              {buddy.avatar ? (
                <img
                  src={buddy.avatar} // Add a default avatar
                  alt={buddy.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <p className="w-10 h-10 rounded-full mr-3 bg-dashboard text-black flex items-center justify-center text-sm font-semibold uppercase">
                  {buddy.name.slice(0, 2)}
                </p>
              )}
              <div>
                <p className="font-medium text-gray-800">{buddy.name}</p>
                <p className="text-sm text-gray-500">{buddy.access}</p>
              </div>
            </div>
          ))}
          <div className="pt-3 pb-5">
            <button className=" bg-jp-orange text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-red-600 w-full">
              Add Member
            </button>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">History</h2>
          <a
            href="#"
            className="text-sm text-blue-500 hover:text-gray-700 hover:underline"
          >
            View all
          </a>
        </div>
        <div className="space-y-3">
          {historyItems?.map((item) => (
            <div key={item.id} className="flex items-start">
              <span className="text-xl text-blue-700 mr-2">•</span>
              <div className="flex-1">
                <p className="text-gray-800 text-nowrap truncate">
                  {item.description}
                </p>
                <p className="text-sm text-gray-500">{item.date}</p>
              </div>
              <p className="text-red-500 font-medium ml-2 text-nowrap">
                {item.amount} JP
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RightPanel;
