"use client";

import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import formatDateWithSuffix from "@/utils/formatDateAndTime";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Buddy = {
  id: number;
  name: string;
  access: string;
  avatar?: string;
};

type HistoryItem = {
  id: string;
  description: string;
  date: string;
  amount: number;
  jpAmount: number;
  activity: {
    activity: string;
    transactionType: string;
  };
  createdAt: string;
};

const fetchUserTransactionHistory = async () => {
  const res = await axios.get("/api/user/history");
  console.log(res.data);
  return res.data;
};

const RightPanel = ({ className }: { className?: string }) => {
  const buddies: Buddy[] = [
    { id: 1, name: "Alice", access: "Full Access" },
    { id: 2, name: "Bob", access: "Limited Access" },
    { id: 3, name: "Charlie", access: "Full Access" },
  ];

  const { data: transactionHistory, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fetchUserTransactionHistory(),
  });

  // Map the fetched transactions to HistoryItem objects
  let historyItems: HistoryItem[] = [];
  if (transactionHistory?.transactions) {
    historyItems = transactionHistory.transactions.map((tx: HistoryItem) => {
      // Determine if transaction is a debit or credit.
      const isDebit = tx.activity.transactionType === "DEBIT";
      const description = isDebit
        ? `Spent on ${tx.activity.activity.toLowerCase()}`
        : `Earned for ${tx.activity.activity.toLowerCase()}`;

      return {
        id: tx.id,
        description,
        date: formatDateWithSuffix(tx.createdAt),
        amount: tx.jpAmount,
      };
    });
  }

  return (
    <div className={`bg-transparent  ${className}`}>
      {/* Buddies Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">Buddies</h2>
          <a
            href="#"
            className="text-sm text-blue-500 hover:text-gray-700 hover:underline"
          >
            <ComingSoonWrapper>View all</ComingSoonWrapper>
          </a>
        </div>
        <div className="space-y-3 bg-white rounded-3xl p-5">
          {buddies.map((buddy) => (
            <div key={buddy.id} className="flex items-center">
              {buddy.avatar ? (
                <Image
                  src={buddy.avatar}
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
            <ComingSoonWrapper>
              <button className="bg-jp-orange text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-red-600 w-full">
                Add Member
              </button>
            </ComingSoonWrapper>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">History</h2>
          <Link
            href="/dashboard/transactions-history"
            className="text-sm text-blue-500 hover:text-gray-700 hover:underline"
          >
            View all
          </Link>
        </div>
        {isLoading ? (
          <p>Loading history...</p>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="flex items-start">
                <span className="text-xl text-blue-700 mr-2">•</span>
                <div className="shrink-0 grow">
                  <p className="text-gray-800 text-nowrap truncate w-full">
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
        )}
      </section>
    </div>
  );
};

export default RightPanel;
