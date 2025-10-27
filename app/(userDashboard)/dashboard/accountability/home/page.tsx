/* eslint-disable react/no-unescaped-entities */

"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { TriangleAlert, Users, Ban, Plus } from "lucide-react";

import { GroupCard } from "@/components/accountability/GroupCard";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface GroupMember {
  userId: string;
  groupId: string;
  role: "ADMIN" | "MEMBER";
  user: User;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
}

interface AccountabilityHomeData {
  createdGroups: Group[];
  joinedGroups: Group[];
  success: boolean;
}

const fetchAccountabilityData = async (): Promise<AccountabilityHomeData> => {
  const { data } = await axios.get(
    `/api/accountability/home-data`
  );
  if (!data.success) {
    throw new Error("API returned an error or success: false");
  }
  return data;
};

// --- Animation Variants for Framer Motion ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Main Page Component ---
export default function AccountabilityHomePage() {
  const { data, isLoading, isError, error, refetch } = useQuery<
    AccountabilityHomeData,
    Error
  >({
    queryKey: ["accountabilityHomeData"],
    queryFn: fetchAccountabilityData,
  });

  //  Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  //  Error State
  if (isError) {
    return (
      <main className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-lg">
          <TriangleAlert
            className="w-12 h-12 text-red-400 mx-auto"
            strokeWidth={1.5}
          />
          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            Oops! Something went wrong.
          </h2>
          <p className="mt-2 text-gray-500">
            We couldn't load your groups. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Retry
          </button>
          <p className="mt-4 text-xs text-gray-400">Error: {error.message}</p>
        </div>
      </main>
    );
  }

  //  Success State
  const joinedGroups = data?.joinedGroups || [];
  const createdGroups = data?.createdGroups || [];

  return (
    <motion.main
      className="p-8 md:p-12 min-h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto grid  my-4 grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12">
        {/* === Column 1: Groups You've Created === */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-5">
            Groups You've Created
          </h2>
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {createdGroups.length > 0 ? (
              createdGroups.map((group) => (
                <motion.div key={group.id} variants={itemVariants}>
                  <GroupCard key={group.id} group={group} />
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-500 bg-white p-8 rounded-xl border border-gray-200 flex flex-col items-center gap-4">
                <Ban className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                <span>You haven't created any groups yet.</span>
              </div>
            )}
          </motion.div>
        </section>

        {/* === Column 2: Groups You're A Member Of === */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-5">
            Groups You're A Member Of
          </h2>
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {joinedGroups.length > 0 ? (
              joinedGroups.map((group) => (
                <motion.div key={group.id} variants={itemVariants}>
                  <GroupCard group={group} />
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-500 bg-white p-8 rounded-xl border border-gray-200 flex flex-col items-center gap-4">
                <Users className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                <span>You haven't joined any groups yet.</span>
              </div>
            )}
          </motion.div>
        </section>
      </div>
      <Link href="/dashboard/accountability-hub/create">
        <div className="mt-12 flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }} // Delay to animate after cards
            className="w-full max-w-md flex items-center justify-center gap-2.5 p-4 bg-white border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-blue-50/80 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 font-medium group"
          >
            <Plus
              className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
              strokeWidth={2.5}
            />
            Create New Group
          </motion.button>
        </div>
      </Link>
    </motion.main>
  );
}
const SkeletonCard = () => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex -space-x-3 items-center flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white"></div>
          <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white -ml-3"></div>
        </div>
        <div className="min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="flex-shrink-0 text-right space-y-1">
        <div className="h-5 bg-gray-200 rounded w-8 ml-auto"></div>
        <div className="h-3 bg-gray-200 rounded w-12 ml-auto"></div>
      </div>
    </div>
  </div>
);

export const LoadingSkeleton = () => {
  return (
    <main className="p-8 md:p-12 bg-gray-50/50 min-h-full animate-pulse">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12">
        {/* Column 1 Skeleton */}
        <section>
          <div className="h-7 bg-gray-300 rounded w-3/5 mb-5"></div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>

        {/* Column 2 Skeleton */}
        <section>
          <div className="h-7 bg-gray-300 rounded w-3/5 mb-5"></div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            {/* Skeleton for a third card, if "created" is longer */}
            <SkeletonCard />
          </div>
        </section>
      </div>
      {/* === Skeleton for Centered "Create New Group" Button === */}
      <div className="mt-12 flex justify-center">
        <div className="h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-full max-w-md"></div>
      </div>
    </main>
  );
};
