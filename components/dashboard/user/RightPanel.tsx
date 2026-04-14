"use client";

import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { format } from "date-fns";
import PageSkeleton from "@/components/PageSkeleton";
import { Card } from "@/components/ui/card";
import { StreakDisplay } from "@/components/userStreak/StreakDisplay";

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
    displayName: string;
  };
  createdAt: string;
  currency?: string;
  txType?: string;
};

const fetchUserTransactionHistory = async () => {
  const res = await axios.get("/api/user/history");
  return res.data;
};

type Props = {
  value: number;
  label: string;
};

const ProgressStatCard = ({ value, label }: Props) => {
  return (
    <Card className="p-3 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="bg-dashboard/10 p-2 rounded-lg">
          <Image src="/Pearls.png" alt="icon" width={28} height={28} />
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-jp-orange leading-none">
            {value}
          </p>
          <p className="text-xs text-gray-500 leading-tight">{label}</p>
        </div>
      </div>
    </Card>
  );
};

const RightPanel = ({
  className,
  jpEarned,
  jpSpent,
  jpBalance,
}: {
  className?: string;
  jpEarned: number;
  jpSpent: number;
  jpBalance: number;
}) => {
  const buddies: Buddy[] = [
    { id: 1, name: "Alice", access: "Full Access" },
    { id: 2, name: "Bob", access: "Limited Access" },
    { id: 3, name: "Charlie", access: "Full Access" },
  ];

  const { data: transactionHistory, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchUserTransactionHistory,
  });

  let historyItems: HistoryItem[] = [];
  if (transactionHistory?.transactions) {
    historyItems = transactionHistory.transactions
      .filter((tx: HistoryItem) => {
        // ❌ Hide CREDIT transactions with 0 amount
        if (
          tx.activity.transactionType === "CREDIT" &&
          (tx.jpAmount === 0 || tx.jpAmount === null)
        ) {
          return false;
        }
        return true;
      })
      .map((tx: HistoryItem) => {
        const isDebit = tx.activity.transactionType === "DEBIT";

        const description = isDebit
          ? `Spent on ${tx.activity.displayName}`
          : `Earned for ${tx.activity.displayName}`;

        return {
          id: tx.id,
          description,
          date: format(new Date(tx.createdAt), "MMM d, yyyy hh:mm a"),
          amount: tx.jpAmount,
          currency: tx.currency,
          txType: tx?.activity?.transactionType,
        };
      });
  }

  return (
    <div
      className={`w-full overflow-x-hidden overflow-y-auto bg-transparent ${className}`}
    >
      <section className="mb-6">
        <div className="space-y-3 bg-white rounded-3xl p-5">
          <h3 className="font-semibold">Progress Snapshot</h3>

          <div className="grid grid-cols-2 gap-3">
            <ProgressStatCard value={jpEarned} label="GP Earned" />
            <ProgressStatCard value={jpSpent} label="GP Spent" />
            <ProgressStatCard value={jpBalance} label="GP Balance" />

            <StreakDisplay />
          </div>
        </div>
      </section>
      {/* Buddies Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">Buddies</h2>
          <Link
            href="#"
            className="text-sm text-blue-500 hover:text-gray-700 hover:underline"
          >
            <ComingSoonWrapper>View all</ComingSoonWrapper>
          </Link>
        </div>
        <div className="space-y-3 bg-white rounded-3xl p-5">
          {buddies.map((buddy) => (
            <div key={buddy.id} className="flex items-center w-full">
              {buddy.avatar ? (
                <Image
                  src={buddy.avatar}
                  alt={buddy.name}
                  className="w-10 h-10 rounded-full mr-3"
                  width={40}
                  height={40}
                />
              ) : (
                <p className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-sm font-semibold uppercase">
                  {buddy.name.slice(0, 2)}
                </p>
              )}
              <div className="w-full">
                <p className="font-medium text-gray-800 break-words">
                  {buddy.name}
                </p>
                <p className="text-sm text-gray-500 break-words">
                  {buddy.access}
                </p>
              </div>
            </div>
          ))}
          <div className="pt-3 pb-5">
            <ComingSoonWrapper>
              <button className="bg-green-600 text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-green-700 w-full transition-all linear">
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
          <PageSkeleton type="transaction-history" />
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="flex items-start w-full">
                <span className="text-xl text-blue-700 mr-2">•</span>
                <div className="flex-1">
                  <p className="text-gray-800 break-words">
                    {item.description}
                  </p>
                  <p className="text-sm text-gray-500 break-words">
                    {item.date}
                  </p>
                </div>
                <p
                  className={`${item.txType === "CREDIT" ? "text-green-500" : "text-red-500"} font-medium ml-2 break-words`}
                >
                  {item.amount} {item?.currency}
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
