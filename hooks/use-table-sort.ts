import { useState } from "react";

type SortDirection = "asc" | "desc";

export function useTableSort<T>(data: T[]) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [direction, setDirection] = useState<SortDirection>("asc");

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === bVal) return 0;

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    return direction === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  return {
    sortedData,
    sortKey,
    direction,
    handleSort,
  };
}
