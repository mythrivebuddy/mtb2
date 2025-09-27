import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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