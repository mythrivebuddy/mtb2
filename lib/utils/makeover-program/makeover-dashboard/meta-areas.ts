import {
  Activity,
  Brain,
  Users,
  Briefcase,
  Wallet,
  Share2,
  Lightbulb,
  Gem,
  Flower2,
} from "lucide-react";

export interface AreaConfig {
  id: number;
  title: string;
  label: string;
  color: string;
  bgColor: string;
  Icon: React.ElementType;
}

export const AREAS: Record<number, AreaConfig> = {
  1: {
    id: 1,
    title: "Physical Vitality",
    label: "Area 1",
    color: "#22C55E",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    Icon: Activity,
  },
  2: {
    id: 2,
    title: "Mental Clarity",
    label: "Area 2",
    color: "#6366F1",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    Icon: Brain,
  },
  3: {
    id: 3,
    title: "Relationships",
    label: "Area 3",
    color: "#EC4899",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    Icon: Users,
  },
  4: {
    id: 4,
    title: "Career Growth",
    label: "Area 4",
    color: "#F59E0B",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    Icon: Briefcase,
  },
  5: {
    id: 5,
    title: "Financial Health",
    label: "Area 5",
    color: "#10B981",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    Icon: Wallet,
  },
  6: {
    id: 6,
    title: "Contribution",
    label: "Area 6",
    color: "#0EA5E9",
    bgColor: "bg-sky-50 dark:bg-sky-900/20",
    Icon: Share2,
  },
  7: {
    id: 7,
    title: "Wisdom & Learning",
    label: "Area 7",
    color: "#8B5CF6",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    Icon: Lightbulb,
  },
  8: {
    id: 8,
    title: "Self-Worth",
    label: "Area 8",
    color: "#EAB308",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    Icon: Gem,
  },
  9: {
    id: 9,
    title: "Inner Peace",
    label: "Area 9",
    color: "#14B8A6",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    Icon: Flower2,
  },
};
