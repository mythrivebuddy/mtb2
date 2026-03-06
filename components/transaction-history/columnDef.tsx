import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface Transaction {
  id: string;
  createdAt: string;
  jpAmount: number;
  activity: {
    activity: string;
    transactionType: string;
    displayName: string;
  };
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => (
      <div>
        {format(new Date(row.original.createdAt), "MMM d, yyyy hh:mm a")}
      </div>
    ),
  },
  {
    accessorKey: "activity.displayName",
    header: "Activity",
  },
  {
    accessorKey: "activity.transactionType",
    header: "Type",
  },
  {
    accessorKey: "jpAmount",
    header: "Amount",
    cell: ({ row }) => {
      const type = row.original.activity.transactionType;
      const currency = (row.original as any).currency || "GP";

      return (
        <div
          className={`font-medium ${type === "CREDIT" ? "text-green-600" : "text-red-600"
            }`}
        >
          {type === "CREDIT" ? "+" : "-"} {row.original.jpAmount} {currency}
        </div>
      );
    },
  },
];
