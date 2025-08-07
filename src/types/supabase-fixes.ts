// Temporary type fixes for Supabase queries without proper types
// This will be replaced when types are properly generated

export function getFirstOrValue<T>(data: T | T[]): T | undefined {
  return Array.isArray(data) ? data[0] : data;
}

export function safeGetProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T | T[] | undefined | null,
  key: K
): T[K] | undefined {
  if (!obj) return undefined;
  const item = Array.isArray(obj) ? obj[0] : obj;
  return item?.[key];
}

export function mapSupabaseResult<T, R>(
  data: T[] | undefined | null,
  mapper: (item: T) => R
): R[] {
  return (data || []).map(mapper);
}