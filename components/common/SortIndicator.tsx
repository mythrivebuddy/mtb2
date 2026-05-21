"use client";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
export default function SortIndicator({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) {
  const isActive = sortBy === field;

  return (
    <span
      className={`ml-1 flex items-center justify-center transition-all duration-150
        ${
          isActive
            ? "text-blue-600 opacity-100"
            : "text-gray-400 opacity-40 group-hover:opacity-80 group-hover:text-gray-600"
        }`}
    >
      {isActive ? (
        sortOrder === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </span>
  );
}