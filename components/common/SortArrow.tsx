import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  active: boolean;
  direction: "asc" | "desc";
};

export default function SortArrow({ active, direction }: Props) {
  if (!active) return <ArrowUpDown className="w-4 h-4 opacity-40" />;
  return direction === "asc" ? (
    <ArrowUp className="w-4 h-4" />
  ) : (
    <ArrowDown className="w-4 h-4" />
  );
}