import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { format, parseISO } from "date-fns";

// Format date function for consistent date display throughout the app
export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'EEE, MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
};
