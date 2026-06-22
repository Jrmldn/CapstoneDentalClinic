import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeRelation<T>(r: T | T[] | null): T | null {
  if (r === null || r === undefined) return null;
  return Array.isArray(r) ? (r[0] ?? null) : r;
}
