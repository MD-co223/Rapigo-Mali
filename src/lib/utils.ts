import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(searchParams: URLSearchParams) {
  const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const offset = Math.max(0, rawOffset);
  return { limit, offset };
}
