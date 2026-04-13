import { useState, useCallback, useEffect, useRef } from 'react';

interface PaginatedApiOptions<T> {
  pageSize?: number;
  initialParams?: Record<string, any>;
  autoRefresh?: number; // ms
  fetcher: (params: Record<string, any>) => Promise<T[]>;
}

export function usePaginatedApi<T>({
  pageSize = 20,
  initialParams = {},
  autoRefresh,
  fetcher,
}: PaginatedApiOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const paramsRef = useRef(initialParams);

  const loadPage = useCallback(
    async (pageToLoad: number, reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = { ...paramsRef.current, page: pageToLoad, limit: pageSize };
        const data = await fetcher(params);
        setItems((prev) => (reset ? data : [...prev, ...data]));
        setHasMore(data.length === pageSize);
        setPage(pageToLoad);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [fetcher, pageSize]
  );

  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) loadPage(page + 1);
  }, [loadPage, loading, hasMore, page]);

  const setParams = useCallback(
    (newParams: Record<string, any>) => {
      paramsRef.current = { ...paramsRef.current, ...newParams };
      refresh();
    },
    [refresh]
  );

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  return {
    items,
    loading,
    hasMore,
    error,
    refresh,
    loadMore,
    setParams,
  };
}