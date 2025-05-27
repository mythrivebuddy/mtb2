export type SortKey = "jpEarned" | "jpSpent" | "jpBalance" | "jpTransaction";
export type SortSelectProps = {
  orderBy: SortKey;
  // page: number;
  // limit: number;
  onValueChange: (value: SortKey) => void;
};
