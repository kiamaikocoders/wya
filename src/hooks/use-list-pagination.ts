import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_LIST_PAGE_SIZE = 20;

type ResetKey = string | number | boolean | null | undefined;

/**
 * Client-side list paging. Resets to page 1 when `resetKey` changes
 * (e.g. search/filter). Clamps page when the filtered list shrinks.
 */
export function useListPagination<T>(
  items: T[],
  options?: { pageSize?: number; resetKey?: ResetKey }
) {
  const pageSize = options?.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [options?.resetKey, pageSize]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    pageItems,
    totalPages,
    total,
    pageSize,
  };
}

/** Build a compact window of page numbers with ellipsis markers. */
export function getPageWindow(
  current: number,
  totalPages: number,
  siblingCount = 1
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = current - siblingCount; i <= current + siblingCount; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis');
    result.push(p);
    prev = p;
  }
  return result;
}
