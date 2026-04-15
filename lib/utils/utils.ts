import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sun, Moon } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add the new function here
export function splitFullName(
  fullName: string | null | undefined
): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: "", lastName: "" };
  }
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  return { firstName, lastName };
}



export const getGreetingData = () => {
  const hour = new Date().getHours();

  // Morning: 5 AM – 11:59 AM
  if (hour >= 5 && hour < 12) {
    return {
      text: "Good Morning",
      Icon: Sun,
      color: "text-yellow-500",
    };
  }

  // Afternoon: 12 PM – 4:59 PM
  if (hour >= 12 && hour < 17) {
    return {
      text: "Good Afternoon",
      Icon: Sun,
      color: "text-orange-500",
    };
  }

  // Evening/Night: 5 PM – 4:59 AM
  return {
    text: "Good Evening",
    Icon: Moon,
    color: "text-indigo-500",
  };
};