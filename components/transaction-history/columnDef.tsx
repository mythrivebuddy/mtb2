import { ColumnDef } from "@tanstack/react-table";
import { addDays, format, isAfter } from "date-fns";
import Link from "next/link";
import SortIndicator from "../common/SortIndicator";

type TableMetaType = {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
};

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
    buyerId?: string;
    buyerName?: string;
    productName?: string;
    invoiceUrl?: string;
    referredUserId?: string;
    referredUserName?: string;
    contextType?: string;
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
    header: ({ table }) => {
      const { sortBy, sortOrder, onSort } =
        (table.options.meta as TableMetaType) || {};

      return (
        <div
          onClick={() => onSort?.("createdAt")}
          className="flex items-center cursor-pointer group"
        >
          Date & Time
          <SortIndicator
            field="createdAt"
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      );
    },
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
      const userId = meta?.userId || meta?.joinerId || meta?.buyerId;

      const userName = meta?.userName || meta?.joinerName || meta?.buyerName;

      const title = meta?.challengeTitle || meta?.programName;

      // ✅ Challenge / MMP
      if (userId && userName && title) {
        return (
          <div>
            <Link
              href={`/profile/${userId}`}
              className="hover:underline text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              target="_blank"
            >
              {userName?.trim()}
            </Link>{" "}
            joined {title}
          </div>
        );
      }

      // ✅ STORE PURCHASE (NEW)
      if (meta?.buyerId && meta?.buyerName && meta?.productName) {
        return (
          <div>
            <Link
              href={`/profile/${meta.buyerId}`}
              className="hover:underline text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              target="_blank"
            >
              {meta.buyerName}
            </Link>{" "}
            bought {meta.productName}
          </div>
        );
      }
      // ✅ AFFILIATE EARNING (NEW)
      // ✅ AFFILIATE EARNING (FIXED)
      if (
        data.activity.activity === "AFFILIATE_EARNING" &&
        meta?.referredUserId
      ) {
        const userName =
          meta.referredUserName || data.activity.displayName.split(" ")[0];

        let actionText = "did an action via your referral";

        if (meta.contextType === "SUBSCRIPTION") {
          actionText = data.activity.displayName;
        }

        if (meta.contextType === "MMP_PROGRAM") {
          actionText = meta.programName
            ? `joined ${meta.programName.trim()} using your referral`
            : "joined a program using your referral";
        }

        if (meta.contextType === "CHALLENGE") {
          actionText = meta.challengeTitle
            ? `joined ${meta.challengeTitle} using your referral`
            : "joined a challenge using your referral";
        }

        if (meta.contextType === "STORE_PRODUCT") {
          actionText = meta.productName
            ? `purchased ${meta.productName} using your referral`
            : "purchased a product using your referral";
        }

        return (
          <div>
            <Link
              href={`/profile/${meta.referredUserId}`}
              className="hover:underline text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              target="_blank"
            >
              {userName}
            </Link>{" "}
            {actionText}
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span>{data.activity.displayName}</span>

          {meta?.invoiceUrl && (
            <button
              onClick={() => window.open(meta.invoiceUrl, "_blank")}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Invoice
            </button>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "activity.transactionType",
    header: "Type",
  },
  {
    accessorKey: "jpAmount",
    header: ({ table }) => {
      const { sortBy, sortOrder, onSort } =
        (table.options.meta as TableMetaType) || {};

      return (
        <div
          onClick={() => onSort?.("jpAmount")}
          className="flex items-center cursor-pointer group"
        >
          Amount
          <SortIndicator
            field="jpAmount"
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      const isCredit = data.activity.transactionType === "CREDIT";
      const availableDate = addDays(new Date(data.createdAt), 10);
      const isUnlocked = isAfter(new Date(), availableDate);

      if (data.breakdown) {
        return (
          <div className="text-sm text-start space-y-1">
            <div
              className={`font-medium ${
                isCredit ? "text-green-600" : "text-red-600"
              }`}
            >
              {isCredit ? "+" : "-"} {data.currency}{" "}
              {data.breakdown.finalAmount.toFixed(2)}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
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
            {isCredit && !isUnlocked && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                Available after {format(availableDate, "MMM d, yyyy")}
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-1">
          <span className={isCredit ? "text-green-600" : "text-red-600"}>
            {isCredit ? "+" : "-"} {data.currency} {data.jpAmount}
          </span>

          {/* ✅ HOLDING BADGE */}
          {isCredit &&
            !isUnlocked &&
            (data.currency === "INR" || data.currency === "USD") && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                Available after {format(availableDate, "MMM d, yyyy")}
              </div>
            )}
        </div>
      );
    },
  },
];
