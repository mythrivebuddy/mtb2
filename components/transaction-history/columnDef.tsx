import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";

export interface Transaction {
  id: string;
  createdAt: string;
  currency?: string;
  jpAmount: number;

  user?: {
    id: string;
    name: string;
  };

  challengeTitle?: string;

breakdown?: {
  baseAmount: number;
  discount?: number;
  commission: number;
  commissionPercent?: number;
  finalAmount: number;
};
  activityMeta?: {
    userId?: string;
    userName?: string;
    challengeTitle?: string;
    joinerId?: string;
    joinerName?: string;
     programName?: string;
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
    id: "activity",
    header: "Activity",
    cell: ({ row }) => {
      const data = row.original;
const meta = data.activityMeta;
      const userId =
        data.activityMeta?.userId || data.activityMeta?.joinerId;

      const userName =
        data.activityMeta?.userName || data.activityMeta?.joinerName;
      const title = meta?.challengeTitle || meta?.programName;
      if (userId && userName && title) {
        return (
          <div>
            <Link
              href={`/profile/${userId}`}
              className="hover:underline text-blue-700 hover:text-blue-800"
              target="_blank"
            >
              {userName?.trim()}
            </Link>{" "}
            joined {title}
          </div>
        );
      }

      return <span>{data.activity.displayName}</span>;
    },
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
              {isCredit ? "+" : "-"} {data.currency} {data.breakdown.finalAmount.toFixed(2)}
            </div>

           <div className="text-xs text-gray-500">
  {data.currency} {data.breakdown.baseAmount.toFixed(2)}

  {data.breakdown.discount ? (
    <>
      {" - "}
      {data.currency} {data.breakdown.discount.toFixed(2)} discount
    </>
  ) : null}

  {" - "}
  {data.currency} {data.breakdown.commission.toFixed(2)} commission
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
