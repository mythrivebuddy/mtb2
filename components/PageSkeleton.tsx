// components/PageSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";

type PageSkeletonProps = {
  type:
    | "dashboard"
    | "leaderboard"
    | "align-action"
    | "my-requests"
    | "available-requests"
    | "approve"
    | "claims"
    | "reviewer"
    | "miracle-log"
    | "my-profile"
    | "notification"
    | "Progress-vault"
    | "refer-friend"
    | "subscription"
    | " user-profile"
    | "email-templates"
    | "prosperity-drop"
    | "faq"
    | "update-jp"
    | " manage-plans"
    | "manage-store-product"
    | "transaction-history"
    | "buddylens"
    | "spotlight"
    | "coach-profile";
};

export default function PageSkeleton({ type }: PageSkeletonProps) {
  // ! user-panel

  // for dashboard
  if (type === "dashboard") {
    return (
      <div className="animate-pulse px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ================= MAIN CONTENT ================= */}
          <div className="flex-1">
            {/* Greeting */}
            <div className="space-y-3 mb-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>

            {/* MyLifeBlueprint Skeleton */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border mb-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>

            {/* Dashboard Cards (MATCHES your dynamic cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col"
                >
                  {/* Icon */}
                  <Skeleton className="h-14 w-14 rounded-2xl mb-5" />

                  {/* Title */}
                  <Skeleton className="h-5 w-40 mb-2" />

                  {/* Content (simulate dynamic card content like blooms/tasks/etc) */}
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>

                  {/* CTA Button */}
                  <Skeleton className="h-9 w-full rounded-full mt-4" />
                </div>
              ))}
            </div>

            {/* Mobile Steppers Skeleton */}
            <div className="mt-6 lg:hidden space-y-6">
              <div>
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>

              <div>
                <Skeleton className="h-5 w-40 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>

          {/* ================= RIGHT PANEL ================= */}
          <div className="lg:flex-[0.4] mt-8 lg:mt-0 space-y-6 self-start pt-2 lg:pt-[68px]">
            {/* Stats / JP Section */}
            {/* MyLifeBlueprint Mirror */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />

              <div className="pt-2 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Buddies */}
            <div className="bg-white rounded-3xl shadow-md p-5 space-y-4">
              <Skeleton className="h-5 w-20" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-10 w-full rounded-full" />
            </div>

            {/* History */}
            <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
              <Skeleton className="h-5 w-16" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start w-full">
                  <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-full max-w-[200px]" />
                    <Skeleton className="h-2 w-28" />
                  </div>
                  <Skeleton className="h-3 w-14 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Stepper Skeleton */}
        <div className="hidden lg:block mt-8 space-y-6">
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // for leaderboard
  if (type === "leaderboard") {
    return (
      <div className="animate-pulse flex flex-col min-h-screen bg-[#eaf6ff] px-8 py-6 space-y-6">
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

  // for align-action
  if (type === "align-action") {
    return (
      <div className="animate-pulse grid gap-6 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 shadow-md rounded-2xl p-6 space-y-5 bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-48 rounded-md" />
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>

            {/* Selected Task */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Other Tasks */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mb-1" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-4">
              <Skeleton className="h-10 w-37 rounded-lg bg-gradient-to-r from-green-400 to-green-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // for my-requests
  if (type === "my-requests") {
    return (
      <div className="space-y-6">
        {/* Request Cards */}
        <div className="animate-pulse grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="border border-gray-200 bg-gray-50 rounded-lg p-6 space-y-4"
            >
              {/* Title and Status */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-64 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>

              {/* Description */}
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />

              {/* Delete Button */}
              <div className="flex justify-end">
                <Skeleton className="h-9 w-28 rounded-md bg-red-300/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  //  for available-requests
  if (type === "available-requests") {
    return (
      <div className="animate-pulse space-y-6">
        {/* Request Cards */}
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="border border-gray-200 bg-gray-50 rounded-lg p-6 space-y-4"
            >
              {/* Title and Status */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-64 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>

              {/* Description */}
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />

              {/* Claim Button */}
              <div className="flex justify-end">
                <Skeleton className="h-9 w-28 rounded-md bg-blue-400/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // for approve
  if (type === "approve") {
    return (
      <div className="animate-pulse max-w-4xl mx-auto p-6">
        {/* Page Title Skeleton */}
        <Skeleton className="h-10 w-72 mx-auto mb-7 rounded-md" />

        {/* Simulated 3 pending claim cards */}
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl shadow-lg p-6 space-y-4 border border-gray-200 bg-gray-50 m-7"
          >
            {/* Reviewer Name */}
            <Skeleton className="h-5 w-48 rounded-md" />

            {/* Domain */}
            <Skeleton className="h-4 w-32 rounded-md" />

            {/* Tier */}
            <Skeleton className="h-4 w-24 rounded-md" />

            {/* Reward */}
            <Skeleton className="h-4 w-40 rounded-md" />

            {/* Reviewer Profile Link */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-6 rounded" />
            </div>

            {/* Social Media URL */}
            <Skeleton className="h-4 w-64 rounded-md" />

            {/* Buttons: Approve & Reject */}
            <div className="flex gap-11">
              <Skeleton className="h-9 w-28 rounded-md bg-green-400/70" />
              <Skeleton className="h-9 w-28 rounded-md bg-red-400/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // for claims
  if (type === "claims") {
    return (
      <div className="space-y-6">
        {/* Request Cards */}
        <div className="animate-pulse grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="border border-gray-200 bg-gray-50 rounded-lg p-6 space-y-4"
            >
              {/* Title and Status */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-64 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>

              {/* Description */}
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />

              {/* Claim Button */}
              <div className="flex justify-end">
                <Skeleton className="h-9 w-28 rounded-md bg-blue-400/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // for reviewr
  if (type === "reviewer") {
    return (
      <div className="animate-pulse p-7 overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg flex justify-center items-center">
        <div className="p-11">
          {/* Title */}
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 w-60 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Right column */}
            <div className="bg-gray-100 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-4 space-y-4">
            {/* Feedback */}
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-1 animate-pulse" />
              <div className="h-16 w-full bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Review Text */}
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-1 animate-pulse" />
              <div className="h-16 w-full bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Answers */}
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // for miracle-log
  if (type === "miracle-log") {
    return (
      <div className="animate-pulse bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-500">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-4 items-start border-t pt-4"
            >
              {/* Log Content */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              {/* Date & Time */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // for my-profile
  if (type === "my-profile") {
    return (
      <div className="animate-pulse max-w-8xl mx-auto p-4 sm:p-6">
        <div className="bg-white shadow-md rounded-2xl p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Skeleton className="h-6 w-2/3 sm:w-1/3" />
            <Skeleton className="h-9 w-1/2 sm:w-28 rounded-md" />
          </div>

          {/* Avatar & Upload */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full sm:w-3/4" />
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Save Button */}
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // for notification
  if (type === "notification") {
    return (
      <div className="p-6 animate-pulse">
        {/* Notification Settings Skeleton */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="h-5 w-1/3 bg-gray-200 rounded mb-4" /> {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-5 w-1/2 bg-gray-200 rounded" />{" "}
            {/* Toggle Label */}
            <div className="h-5 w-10 bg-gray-300 rounded-full ml-auto" />{" "}
            {/* Switch */}
          </div>
          <div className="h-4 w-2/3 bg-gray-200 rounded" /> {/* Description */}
        </div>

        {/* Recent Notifications Header */}
        <div className="h-5 w-1/4 bg-gray-200 rounded mb-4" />

        {/* Skeleton Notification Cards */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-lg shadow-sm border mb-3"
          >
            <div className="flex items-start gap-4">
              {/* Icon Placeholder */}
              <div className="h-6 w-6 bg-gray-300 rounded-full mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-gray-200 rounded" /> {/* Title */}
                <div className="h-3 w-full bg-gray-100 rounded" />{" "}
                {/* Message */}
                <div className="flex justify-between text-xs mt-2">
                  <div className="h-3 w-20 bg-gray-100 rounded" />{" "}
                  {/* Timestamp */}
                  <div className="h-3 w-12 bg-gray-100 rounded" />{" "}
                  {/* Read status */}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // for Progress-vault
  if (type === "Progress-vault") {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-1/3 bg-gray-200 rounded mb-2" />
          <CardDescription className="h-4 w-1/2 bg-gray-100 rounded" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="h-4 w-1/2 bg-gray-100 rounded mb-2"></th>
                  <th className="h-4 w-1/4 bg-gray-100 rounded mb-2"></th>
                  <th className="h-4 w-[200px] bg-gray-100 rounded mb-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-4 pr-4">
                      <div className="h-4 w-[90%] bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-2/3 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-32 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-300 rounded-md" />
                        <div className="h-8 w-8 bg-gray-300 rounded-md" />
                        <div className="h-8 w-8 bg-gray-300 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // for  Referral-skeleton
  if (type === "refer-friend") {
    return (
      <div className=" px-4 py-8">
        <div className="max-w-8xl mx-auto space-y-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />

          {/* Referral Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-6 w-16 bg-gray-300 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-6 w-20 bg-gray-300 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Share Via Card */}
          <Card>
            <CardHeader>
              <CardTitle className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Invite via Email */}
          <Card>
            <CardHeader>
              <CardTitle className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mt-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  //  for subscription
  if (type === "subscription") {
    return (
      <div className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 space-y-3">
            <Skeleton className="h-10 w-2/3 mx-auto rounded-xl" />
            <Skeleton className="h-5 w-1/2 mx-auto rounded-lg" />
          </div>

          {/* User Status Banner */}
          <div className="bg-indigo-50 border-l-4 border-indigo-300 p-5 sm:p-6 rounded-lg shadow-md mb-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              {/* Left side */}
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-56 rounded" />
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>
              {/* Right side buttons */}
              <div className="flex flex-row md:flex-col gap-3">
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start mb-12">
            {[1, 2, 3, 4].map((_, i) => (
              <div
                key={i}
                className="relative rounded-2xl p-6 border border-slate-200 bg-white flex flex-col h-full space-y-4"
              >
                {/* Plan name */}
                <Skeleton className="h-4 w-24 mx-auto rounded" />

                {/* Price block */}
                <div className="space-y-2">
                  <Skeleton className="h-8 w-36 mx-auto rounded-lg" />
                  <Skeleton className="h-4 w-24 mx-auto rounded" />
                  <Skeleton className="h-3 w-28 mx-auto rounded" />
                </div>

                {/* Divider + features */}
                <div className="border-t border-slate-100 pt-4 space-y-3 flex-grow">
                  {[1, 2, 3, 4].map((_, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                      <Skeleton className="h-4 w-full rounded" />
                    </div>
                  ))}
                </div>

                {/* Button */}
                <Skeleton className="h-11 w-full rounded-xl mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // for user-profile
  if (type === " user-profile") {
    return (
      <div className="animate-pulse container mx-auto px-4 py-8">
        <div className="max-w-8xl mx-auto space-y-8">
          <Card className="bg-white/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-28 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-10 w-40 rounded-md" />
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Skeleton className="h-8 w-32 rounded-md" />

              <div className="flex space-x-4 items-center">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // for dashboard's right section transaction history
  if (type === "transaction-history") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-start w-full">
            <Skeleton className="h-5 w-5 mr-2 rounded-full bg-blue-300" />

            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full max-w-sm" />
              <Skeleton className="h-3 w-32" />
            </div>

            <Skeleton className="h-4 w-16 ml-2 bg-red-300" />
          </div>
        ))}
      </div>
    );
  }

  // for buddylens
  if (type === "buddylens") {
    return (
      <div className="max-w-8xl mx-auto p-6">
        <Card className="rounded-2xl shadow-lg p-6 space-y-6 animate-pulse">
          {/* Tabs */}
          <div className="mb-4 grid w-full grid-cols-3 gap-4">
            <div className="h-10 bg-gray-300 rounded-full" />
            <div className="h-10 bg-gray-300 rounded-full" />
            <div className="h-10 bg-gray-300 rounded-full" />
          </div>

          {/* Simulated Tab Content — repeatable card-like blocks */}
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="border rounded-xl p-4 shadow-sm bg-gray-100 space-y-4"
              >
                {/* Title */}
                <div className="h-6 bg-gray-300 rounded w-1/2" />

                {/* Description */}
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />

                {/* Button row */}
                <div className="flex space-x-4 pt-2">
                  <div className="h-10 w-24 bg-gray-300 rounded-md" />
                  <div className="h-10 w-24 bg-gray-300 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ! admin-panel
  // for email-templates
  if (type === "email-templates") {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader>
                <TableRow>
                  <TableHead>Template ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6 py-7">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-6 py-7">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="px-6 py-7">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="px-6 py-7">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-6 py-7">
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // for prosperity-drop
  if (type === "prosperity-drop") {
    return (
      <div className="animate-pulse mx-auto py-10 px-0">
        <h1 className="text-2xl font-bold mb-6">
          Prosperity Drop Applications
        </h1>
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(7)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-7 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-28 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // for faq
  if (type === "faq") {
    return (
      <ul className="space-y-7">
        {[...Array(4)].map((_, i) => (
          <li key={i} className="border p-4 rounded bg-white/50">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-5/6" />
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // for update-jp
  if (type === "update-jp") {
    return (
      <div className="animate-pulse max-w-4xl mx-auto p-6 space-y-8">
        {/* Page Heading */}
        <Skeleton className="h-7 w-1/3" />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Update Activity JP Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-2/3" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Field 1 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>

              {/* Field 2 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Button (matches button style) */}
              <Skeleton className="h-10 w-full rounded-md bg-primary" />
            </CardContent>
          </Card>

          {/* Magic Box Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-1/2" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Field 1 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Field 2 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Button (matches button style) */}
              <Skeleton className="h-10 w-full rounded-md bg-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // for manage-plans
  if (type === " manage-plans") {
    return (
      <div className="animate-pulse p-4 space-y-4">
        {/* Page Title */}
        <Skeleton className="h-8 w-48" />

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
                {/* Table Header */}
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {[
                      "Name",
                      "JP Multiplier",
                      "Discount (%)",
                      "Price",
                      "Actions",
                    ].map((_, i) => (
                      <TableHead key={i} className="px-6 py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                {/* Loading Rows */}
                <TableBody>
                  {Array.from({ length: 7 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Skeleton className="h-8 w-24 rounded-md" />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Skeleton className="h-8 w-24 rounded-md" />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-16 rounded-md bg-blue-600" />
                          {/* <Skeleton className="h-8 w-16 rounded-md bg-red-600" /> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // for manage-store-product
  if (type === "manage-store-product") {
    return (
      <div className="animate-pulse p-4 space-y-4">
        <Skeleton className="h-8 w-48" /> {/* Title Placeholder */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 bg-white rounded-md shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Name",
                  "Category",
                  "Base Price",
                  "Monthly Price",
                  "Yearly Price",
                  "Lifetime Price",
                  "Created At",
                  "Actions",
                ].map((header, i) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="bg-white">
                  {Array.from({ length: 7 }).map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                  <td className="px-6 py-4 space-x-2">
                    <Skeleton className="h-8 w-16 inline-block rounded-md bg-blue-600" />
                    <Skeleton className="h-8 w-16 inline-block rounded-md bg-red-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // for spotlight
  if (type === "spotlight") {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse space-y-8">
        {/* Title */}
        <div className="h-6 w-2/3 bg-gray-300 rounded" />

        {/* Current Spotlight */}
        <div className="space-y-4">
          <div className="h-5 w-1/3 bg-gray-300 rounded" />
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gray-300" />
              {/* Details */}
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/2 bg-gray-300 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
                <div className="h-10 w-32 mt-4 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Heading */}
        <div className="h-5 w-1/3 bg-gray-300 rounded" />

        {/* Table Skeleton */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b pb-4 pt-2"
            >
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-300" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-300 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>

              {/* Date */}
              <div className="h-4 w-32 bg-gray-200 rounded" />

              {/* Status */}
              <div className="h-6 w-20 bg-gray-300 rounded-full" />

              {/* View Profile */}
              <div className="h-10 w-24 bg-gray-300 rounded" />

              {/* Actions */}
              <div className="flex gap-2">
                <div className="h-10 w-20 bg-gray-300 rounded" />
                <div className="h-10 w-24 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6 space-x-4">
          <div className="h-8 w-8 rounded bg-gray-300" />
          <div className="h-8 w-8 rounded bg-gray-300" />
          <div className="h-8 w-8 rounded bg-gray-300" />
        </div>
      </div>
    );
  }

  // for Coach/Soloprenure Profile
  if (type === "coach-profile") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-gray-900 animate-pulse">
        <main className="max-w-6xl mx-auto px-6 md:px-10 py-12 space-y-28">
          {/* ── HERO ── */}
          <section className="flex flex-col md:flex-row gap-14">
            {/* LEFT */}
            <div className="flex-1 space-y-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-gray-200 border-4 border-white shadow-lg shrink-0" />

                <div className="space-y-3 flex-1 pt-2">
                  {/* Name */}
                  <div className="h-9 w-56 bg-gray-200 rounded-xl" />
                  {/* Tagline */}
                  <div className="h-5 w-80 bg-gray-100 rounded-lg" />
                  <div className="h-5 w-64 bg-gray-100 rounded-lg" />
                  {/* Domain tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[80, 100, 72, 90].map((w, i) => (
                      <div
                        key={i}
                        className="h-6 rounded-full bg-blue-100"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                  {/* Audience tags */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[64, 88, 76].map((w, i) => (
                      <div
                        key={i}
                        className="h-6 rounded-full bg-gray-100"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="w-full md:w-96 bg-white rounded-3xl p-8 shadow-xl border space-y-6 shrink-0">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-32 bg-gray-100 rounded mx-auto" />
              {/* Book button */}
              <div className="h-11 w-full bg-blue-200 rounded-xl" />
              {/* Message button */}
              <div className="h-11 w-full bg-gray-100 rounded-xl" />
              <div className="h-3 w-40 bg-gray-100 rounded mx-auto" />
            </div>
          </section>

          {/* ── OUTCOME ── */}
          <section className="bg-white border-t-4 border-blue-200 rounded-3xl p-12 shadow-sm space-y-10">
            <div className="h-3 w-24 bg-blue-100 rounded" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-gray-200 rounded-xl" />
              <div className="h-8 w-1/2 bg-gray-200 rounded-xl" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 bg-blue-200 rounded-full shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-4/5 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── PROGRAMS ── */}
          <section className="space-y-10">
            <div className="h-8 w-56 bg-gray-200 rounded-xl" />
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl border shadow-sm space-y-4"
                >
                  <div className="h-4 w-20 bg-blue-100 rounded-full" />
                  <div className="h-6 w-40 bg-gray-200 rounded-lg mt-4" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-4 w-24 bg-blue-100 rounded mt-4" />
                  <div className="h-10 w-full bg-blue-200 rounded-xl mt-6" />
                </div>
              ))}
            </div>
          </section>

          {/* ── ABOUT + EXPERIENCE ── */}
          <section className="grid md:grid-cols-2 gap-14">
            {/* ABOUT */}
            <div className="space-y-6">
              <div className="h-8 w-48 bg-gray-200 rounded-xl" />
              <div className="space-y-2">
                {[100, 95, 88, 92, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-100 rounded"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-2">
                <div className="h-3 w-32 bg-blue-100 rounded" />
                <div className="h-5 w-48 bg-blue-200 rounded" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[72, 88, 64, 96, 80].map((w, i) => (
                  <div
                    key={i}
                    className="h-6 rounded-full bg-gray-100"
                    style={{ width: w }}
                  />
                ))}
              </div>
            </div>

            {/* EXPERIENCE */}
            <div className="space-y-8">
              <div className="h-8 w-56 bg-gray-200 rounded-xl" />
              <div className="grid grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border text-center shadow-sm space-y-2"
                  >
                    <div className="h-9 w-16 bg-blue-200 rounded-lg mx-auto" />
                    <div className="h-3 w-28 bg-gray-100 rounded mx-auto" />
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
                <div className="h-3 w-28 bg-gray-100 rounded" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-4/5 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section className="space-y-10">
            <div className="h-8 w-40 bg-gray-200 rounded-xl" />
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl border shadow-sm space-y-4"
                >
                  {[100, 95, 88, 70].map((w, j) => (
                    <div
                      key={j}
                      className="h-4 bg-gray-100 rounded"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                  <div className="h-4 w-32 bg-blue-100 rounded mt-4" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </section>

          {/* ── INTRO VIDEO ── */}
          <section className="text-center space-y-8">
            <div className="h-8 w-48 bg-gray-200 rounded-xl mx-auto" />
            <div className="rounded-3xl overflow-hidden shadow-xl max-w-4xl mx-auto aspect-video bg-gray-200" />
          </section>

          {/* ── PRACTICAL DETAILS ── */}
          <section className="space-y-6 max-w-3xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 rounded-xl mx-auto" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-2xl bg-white p-6">
                <div className="h-5 w-48 bg-gray-100 rounded" />
              </div>
            ))}
          </section>
        </main>
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
