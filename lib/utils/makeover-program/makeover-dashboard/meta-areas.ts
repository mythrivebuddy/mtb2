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
  iconColor: string;
  bgColor: string;
  Icon: React.ElementType;
}

const DARK_ICON_BG =
  "bg-slate-100";

export const AREAS: Record<number, AreaConfig> = {
  1: {
    id: 1,
    title: "Health & Fitness",
    label: "Area 1",
    color: "#22C55E",
    iconColor: "#166534", // green-800
    bgColor: DARK_ICON_BG,
    Icon: Activity,
  },
  2: {
    id: 2,
    title: "Mindset & Emotional Wellbeing",
    label: "Area 2",
    color: "#6366F1",
    iconColor: "#3730A3", // indigo-800
    bgColor: DARK_ICON_BG,
    Icon: Brain,
  },
  3: {
    id: 3,
    title: "Relationships",
    label: "Area 3",
    color: "#EC4899",
    iconColor: "#9D174D", // pink-800
    bgColor: DARK_ICON_BG,
    Icon: Users,
  },
  4: {
    id: 4,
    title: "Career & Business",
    label: "Area 4",
    color: "#F59E0B",
    iconColor: "#92400E", // amber-800
    bgColor: DARK_ICON_BG,
    Icon: Briefcase,
  },
  5: {
    id: 5,
    title: "Wealth & Finance",
    label: "Area 5",
    color: "#10B981",
    iconColor: "#065F46", // emerald-800
    bgColor: DARK_ICON_BG,
    Icon: Wallet,
  },
  6: {
    id: 6,
    title: "Social Life & Influence",
    label: "Area 6",
    color: "#0EA5E9",
    iconColor: "#075985", // sky-800
    bgColor: DARK_ICON_BG,
    Icon: Share2,
  },
  7: {
    id: 7,
    title: "Skills & Intelligence",
    label: "Area 7",
    color: "#8B5CF6",
    iconColor: "#5B21B6", // violet-800
    bgColor: DARK_ICON_BG,
    Icon: Lightbulb,
  },
  8: {
    id: 8,
    title: "Lifestyle & Personal Upgrades",
    label: "Area 8",
    color: "#EAB308",
    iconColor: "#854D0E", // yellow-800
    bgColor: DARK_ICON_BG,
    Icon: Gem,
  },
  9: {
    id: 9,
    title: "Spiritual Growth",
    label: "Area 9",
    color: "#14B8A6",
    iconColor: "#115E59", // teal-800
    bgColor: DARK_ICON_BG,
    Icon: Flower2,
  },
};
