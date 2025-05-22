// components/PageSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

type PageSkeletonProps = {
  type: "dashboard"  | "leaderboard";
};

export default function PageSkeleton({ type }: PageSkeletonProps) {
  if (type === "dashboard") {
    return (
    <div className="flex flex-col min-h-screen bg-[#eaf6ff] px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32 rounded-md" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* JP Cards */}
      <div className="flex space-x-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-md p-4 flex-1 space-y-2"
          >
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        ))}
      </div>

      {/* Spotlight */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="bg-white p-4 rounded-xl shadow-md flex justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Prosperity Drop */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 rounded-md" />
        <div className="bg-white p-4 rounded-xl shadow-md flex justify-between">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Buddies & History */}
      <div className="flex space-x-4">
        {/* Buddies */}
        <div className="bg-white rounded-xl shadow-md p-4 w-1/2 space-y-4">
          <Skeleton className="h-5 w-24 rounded-md" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
          <Skeleton className="h-10 w-full rounded-full bg-[#ff6b6b]" />
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-md p-4 w-1/2 space-y-4">
          <Skeleton className="h-5 w-20 rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-28" />
              </div>
              <Skeleton className="h-3 w-10 rounded-md bg-red-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  }

  if (type === "leaderboard") {
    return (
        <div className="flex flex-col min-h-screen bg-[#eaf6ff] px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32 rounded-md" />
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-48 rounded-md" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex justify-end">
                <Skeleton className="h-10 w-48 rounded-md" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                </div>

                {/* Table Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className={`grid grid-cols-6 gap-4 p-4 ${
                            i === 0 ? "bg-[#FFF5CC]" : "bg-white"
                        } border-b last:border-b-0`}
                    >
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-24 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mt-4">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
            </div>
        </div>
    );
}

  // fallback default
  return (
    <div className="p-4">
      <Skeleton className=" w-full rounded-xl h-full" />
    </div>
  );
}
