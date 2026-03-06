import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface Transaction {
  id: string;
  createdAt: string;
  currency?: string;
  jpAmount: number;
  breakdown?: {
    baseAmount: number;
    commission: number;
    commissionPercent?: number;
    finalAmount: number;

  };
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
      const data = row.original;
      const isCredit = data.activity.transactionType === "CREDIT";

      if (data.breakdown) {
        return (
          <div className="text-sm text-start">
            <div
              className={`font-medium ${isCredit ? "text-green-600" : "text-red-600"
                }`}
            >
              {isCredit ? "+" : "-"} {data.currency} {data.breakdown.finalAmount}
            </div>

            <div className="text-xs  text-gray-500">
              {data.currency} {data.breakdown.baseAmount}
              {" - "}
              {data.currency} {data.breakdown.commission} commision
            </div>
          </div>
        );
      }

      return (
        <span className={isCredit ? "text-green-600" : "text-red-600"}>
          {isCredit ? "+" : "-"} {data.currency} {data.jpAmount}
        </span>
      );
    },
  }
];
