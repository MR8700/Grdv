import { useState, useCallback, useEffect, useRef } from 'react';

interface PaginatedApiOptions<T> {
  pageSize?: number;
  initialParams?: Record<string, unknown>;
  autoRefresh?: number;
  fetcher: (params: Record<string, unknown>) => Promise<T[]>;
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
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, reset = false) => {
      if (loadingRef.current && !reset) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const params = { ...paramsRef.current, page: pageToLoad, limit: pageSize };
        const data = await fetcher(params);

        if (!isMountedRef.current || requestId !== requestIdRef.current) return;

        setItems((prev) => {
          if (reset) return data;

          const merged = [...prev, ...data];
          const seen = new Set<string>();

          return merged.filter((item, index) => {
            const candidate = item as Record<string, unknown>;
            const id =
              candidate.id ??
              candidate.id_user ??
              candidate.id_service ??
              candidate.id_rdv ??
              candidate.id_log ??
              candidate.id_job ??
              `${pageToLoad}-${index}`;

            const key = String(id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        setHasMore(data.length === pageSize);
        setPage(pageToLoad);
      } catch (err: unknown) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err : new Error('Une erreur est survenue.'));
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
        }
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [fetcher, pageSize]
  );

  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) loadPage(page + 1);
  }, [hasMore, loadPage, page]);

  const setParams = useCallback(
    (newParams: Record<string, unknown>) => {
      paramsRef.current = { ...paramsRef.current, ...newParams };
      refresh();
    },
    [refresh]
  );

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
