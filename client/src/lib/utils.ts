import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get badge class based on category
export function getCategoryBadgeClass(category?: string): string {
  if (!category) return "";
  
  const normalizedCategory = category.toLowerCase();
  
  if (normalizedCategory.includes("laboratory")) {
    return "badge-laboratory";
  } else if (normalizedCategory.includes("imaging")) {
    return "badge-imaging";
  }
  
  return "";
}

// Get badge class based on subcategory
export function getSubcategoryBadgeClass(subcategory?: string): string {
  if (!subcategory) return "";
  
  const normalizedSubcategory = subcategory.toLowerCase();
  
  if (normalizedSubcategory.includes("chemistry")) {
    return "badge-clinical-chemistry";
  } else if (normalizedSubcategory.includes("tomography") || normalizedSubcategory.includes("ct")) {
    return "badge-computed-tomography";
  } else if (normalizedSubcategory.includes("hematology")) {
    return "badge-hematology";
  } else if (normalizedSubcategory.includes("immunology") || normalizedSubcategory.includes("serology")) {
    return "badge-immunology";
  } else if (normalizedSubcategory.includes("molecular")) {
    return "badge-molecular";
  } else if (normalizedSubcategory.includes("microbiology")) {
    return "badge-microbiology";
  } else if (normalizedSubcategory.includes("mri") || normalizedSubcategory.includes("magnetic")) {
    return "badge-mri";
  }
  
  return "";
}

// Format date string
export function formatDate(dateString?: string | Date): string {
  if (!dateString) return "N/A";
  
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format a value with fallback for empty values
export function formatValue(value?: string | null, fallback = "Not available"): string {
  return value ? value : fallback;
}

// Truncate text with ellipsis
export function truncateText(text?: string | null, maxLength = 100): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}
