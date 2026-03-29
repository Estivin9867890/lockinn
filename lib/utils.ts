import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function getProgressColor(percent: number): string {
  if (percent >= 80) return "#F87171";
  if (percent >= 60) return "#FBBF24";
  return "#34D399";
}

export function calcProgress(current: number, max: number): number {
  return Math.min(Math.round((current / max) * 100), 100);
}
