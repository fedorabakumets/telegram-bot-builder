import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';

// Debounced query hook for better performance
export function useDebouncedQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  delay: number = 300,
  options?: Partial<UseQueryOptions<T>>
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();
  
  const debouncedInvalidate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, delay);
  }, [queryClient, queryKey, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...useQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      ...options,
    }),
    debouncedInvalidate,
  };
}

// Prefetch hook for critical data
export function usePrefetchQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  condition: boolean = true
) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (condition) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, queryKey, queryFn, condition]);
}