import { useCallback, useState, useRef, useEffect } from 'react';
import { getApiErrorMessage } from '../api/errors';
import { useAuth } from '../store/AuthContext';

export interface ApiState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiMutationOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
  retryOn401?: boolean;
  maxRetries?: number; // nouvelle option
  toast?: { error: (title: string, msg: string) => void }; // toast personnalisé
}

interface ApiErrorShape {
  response?: { status?: number };
}

const extractPayload = <T,>(response: unknown): T => {
  const asAny = response as { data?: T };
  return (asAny?.data ?? response) as T;
};

export function useApiMutation<T = unknown, R = unknown>(
  apiCall: (...args: unknown[]) => Promise<R>,
  options: UseApiMutationOptions<T> = {}
) {
  const { onSuccess, onError, showToast = true, retryOn401 = true, maxRetries = 1, toast } = options;
  const { refreshTokens } = useAuth();
  const isMounted = useRef(true);

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    return () => {
      isMounted.current = false; // éviter update après démontage
    };
  }, []);

  const mutate = useCallback(
    async (...args: unknown[]): Promise<T> => {
      if (!isMounted.current) return Promise.reject('Composant démonté');
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let attempt = 0;

      const handleError = (err: unknown) => {
        const errorMessage = getApiErrorMessage(err);
        if (isMounted.current) setState({ data: null, loading: false, error: errorMessage });
        onError?.(errorMessage);
        if (showToast) {
          const ToastComponent = toast ?? require('../components/ui/AppAlert').Toast;
          ToastComponent.error('Erreur', errorMessage);
        }
        throw err;
      };

      while (attempt <= maxRetries) {
        try {
          const response = await apiCall(...args);
          const data = extractPayload<T>(response);

          if (isMounted.current) setState({ data, loading: false, error: null });
          onSuccess?.(data);

          return data;
        } catch (error) {
          const apiError = error as ApiErrorShape;

          if (retryOn401 && apiError?.response?.status === 401 && attempt < maxRetries) {
            const refreshed = await refreshTokens();
            if (refreshed) {
              attempt++;
              continue;
            }
          }
          return handleError(error);
        }
      }

      return Promise.reject('Max retries exceeded');
    },
    [apiCall, onError, onSuccess, refreshTokens, retryOn401, maxRetries, showToast, toast]
  );

  const reset = useCallback(() => {
    if (isMounted.current) setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}