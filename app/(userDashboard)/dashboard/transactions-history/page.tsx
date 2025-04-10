"use client";

import PageLoader from "@/components/PageLoader";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React from "react";

type Transaction = {
  id: string;
  createdAt: string;
  jpAmount: number;
  activity: {
    activity: string;
    transactionType: string;
  };
};

const fetchTransactions = async (): Promise<{
  transactions: Transaction[];
}> => {
  const res = await axios.get("/api/user/history?viewAll=true");
  return res.data;
};

const TransactionsHistoryPage = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["transactions-history"],
    queryFn: fetchTransactions,
  });

  if (isLoading) return <PageLoader />;
  if (isError)
    return <p className="p-4">Error fetching transactions: {error?.message}</p>;

  const transactions: Transaction[] = data?.transactions || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction History</h1>
      <div className="overflow-x-auto shadow rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                JP Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tx.activity.activity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tx.activity.transactionType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tx.jpAmount} JP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsHistoryPage;
