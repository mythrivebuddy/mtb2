// /hooks/use-server-sort.ts
import { useState } from "react";

export type SortOrder = "asc" | "desc";

export function useServerSort(defaultKey = "createdAt") {
  const [sortBy, setSortBy] = useState<string>(defaultKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

const handleSort = (field: string) => {
  if (sortBy === field) {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  } else {
    setSortBy(field);
    setSortOrder("desc");
  }
};

  return {
    sortBy,
    sortOrder,
    handleSort,
  };
}