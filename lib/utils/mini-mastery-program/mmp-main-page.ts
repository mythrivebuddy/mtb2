import { DurationFilter, ModuleItem, SortOption } from "@/types/client/mini-mastery-program";

export const LIMIT = 9;

export function formatPrice(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "FREE";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${price.toLocaleString("en-IN")}`;
}

export function moduleCount(modules: unknown): number {
  return Array.isArray(modules) ? modules.length : 0;
}

export function parseAchievements(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  return [];
}

export function parseModules(raw: unknown): ModuleItem[] {
  if (Array.isArray(raw)) return raw as ModuleItem[];
  return [];
}

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
};

export const DURATION_OPTIONS: { label: string; value: DurationFilter }[] = [
  { label: "Any Duration", value: "all" },
  { label: "7 Days", value: "7" },
  { label: "11 Days", value: "11" },
  { label: "14 Days", value: "14" },
  { label: "21 Days", value: "21" },
  { label: "30 Days", value: "30" },
];

export const CARD_GRADIENTS = [
  "from-blue-500 via-blue-600 to-indigo-700",
  "from-violet-500 via-purple-600 to-purple-800",
  "from-emerald-400 via-teal-500 to-cyan-700",
  "from-orange-400 via-rose-500 to-pink-600",
  "from-amber-400 via-orange-500 to-red-600",
  "from-sky-400 via-blue-500 to-blue-700",
  "from-fuchsia-500 via-pink-500 to-rose-600",
  "from-lime-400 via-green-500 to-emerald-700",
  "from-indigo-400 via-violet-500 to-purple-700",
] as const;

export function getBgLetter(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "M";
}
