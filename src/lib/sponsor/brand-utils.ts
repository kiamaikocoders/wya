
import { Sponsor } from "./types";
import { cn } from "@/lib/utils";

/**
 * Gets CSS variables for a sponsor's brand colors
 */
export const getSponsorColorVars = (sponsor?: Sponsor | null) => {
  if (!sponsor?.brand_color) return {};
  
  // Convert hex to RGB for CSS variables
  const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(sponsor.brand_color);
  if (!rgb) return {};
  
  return {
    '--sponsor-color': sponsor.brand_color,
    '--sponsor-color-rgb': `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    '--sponsor-gradient': sponsor.brand_gradient || `linear-gradient(135deg, ${sponsor.brand_color} 0%, ${sponsor.brand_color} 100%)`,
  };
};

/**
 * Returns Tailwind classes for sponsor brand elements
 */
export const getSponsorClasses = (sponsor?: Sponsor | null, element: 'button' | 'border' | 'background' | 'text' = 'text') => {
  if (!sponsor?.brand_color) return '';
  
  switch (element) {
    case 'button':
      return cn("hover:opacity-90 transition-opacity", {
        "bg-[var(--sponsor-color)]": true,
        "text-white": true
      });
    case 'border':
      return "border-[var(--sponsor-color)]";
    case 'background':
      return "bg-[var(--sponsor-color)]";
    case 'text':
    default:
      return "text-[var(--sponsor-color)]";
  }
};
