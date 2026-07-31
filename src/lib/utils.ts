import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string, format: "12h" | "24h"): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  
  if (format === "24h") {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  // 12h format
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // Convert 0 to 12
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}
