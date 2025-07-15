"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LeaderboardUser } from "@/types/client/leaderboard";
import { OnlineUser } from "@/types/client/user-info";
import { getInitials } from "@/utils/getInitials";
import Link from "next/link";

const getRankIcon = (rank: number) => {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank.toString();
};

export const getLeaderboardColumns = (
  currentUserId: string | undefined,
  onlineUsers: OnlineUser[] | undefined
): ColumnDef<LeaderboardUser>[] => [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="text-xl font-bold">{getRankIcon(row.original.rank)}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      const isOnline = onlineUsers?.some((u) => u?.userId === user?.id);
      const isCurrentUser = user?.id === currentUserId;

      return (
        <Link
          href={`/profile/${user.id}`}
          target="_blank"
          className={`flex items-center relative gap-3`}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-10 h-10 rounded object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded   bg-gray-200 flex items-center justify-center text-gray-700 font-semibold" >
              {getInitials(user.name)}
            </div>
          )}

         <p className="hover:underline">
          {user.name}
          </p> 

          {(isOnline || isCurrentUser)  && (
            <span className="absolute bottom-0 left-8 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"></span>
          )}
        </Link>
      );
    },
  },
  {
    accessorKey: "jpEarned",
    header: "JP Earned",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.jpEarned}</div>
    ),
  },
  {
    accessorKey: "jpSpent",
    header: "JP Spent",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.jpSpent}</div>
    ),
  },
  {
    accessorKey: "jpTransaction",
    header: "JP Transaction",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.jpTransaction}</div>
    ),
  },
  {
    accessorKey: "jpBalance",
    header: "JP Balance",
    cell: ({ row }) => (
      <div className="font-bold">{row.original.jpBalance}</div>
    ),
  },
];
