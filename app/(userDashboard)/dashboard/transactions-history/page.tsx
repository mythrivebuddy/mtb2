"use client";

import PageLoader from "@/components/PageLoader";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type Transaction = {
  id: string;
  createdAt: string;
  jpAmount: number;
  activity: {
    activity: string;
    transactionType: string;
    displayName: string;
  };
};

const ITEMS_PER_PAGE = 6;

const fetchTransactions = async (
  page: number
): Promise<{
  transactions: Transaction[];
  total: number;
}> => {
  const res = await axios.get(
    `/api/user/history?page=${page}&limit=${ITEMS_PER_PAGE}`
  );
  return res.data;
};

const TransactionsHistoryPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["transactions-history", currentPage],
    queryFn: () => fetchTransactions(currentPage),
  });

  if (isLoading) return <PageLoader />;
  if (isError)
    return <p className="p-4">Error fetching transactions: {error?.message}</p>;

  const transactions: Transaction[] = data?.transactions || [];
  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction History</h1>
      <div className="overflow-x-auto bg-white shadow rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>JP Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  {format(new Date(tx.createdAt), "MMM d, yyyy hh:mm a")}
                </TableCell>
                <TableCell>{tx.activity.displayName}</TableCell>
                <TableCell>{tx.activity.transactionType}</TableCell>
                <TableCell className="font-medium">{tx.jpAmount} JP</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TransactionsHistoryPage;
