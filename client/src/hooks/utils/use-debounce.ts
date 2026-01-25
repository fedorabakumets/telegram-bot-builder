import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for debouncing a value
 * Delays updating the debounced value until after the specified delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing a callback function
 * Returns a debounced version of the callback that delays invoking func until after delay milliseconds
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for debouncing with immediate execution option
 * Can execute immediately on first call, then debounce subsequent calls
 */
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean; // Execute immediately on first call
    trailing?: boolean; // Execute after delay (default behavior)
    maxWait?: number; // Maximum time to wait before executing
  } = {}
): T {
  const { leading = false, trailing = true, maxWait } = options;
  
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

    lastCallTimeRef.current = now;

    const shouldInvokeLeading = leading && timeSinceLastCall >= delay;
    const shouldInvokeMaxWait = maxWait && timeSinceLastInvoke >= maxWait;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }

    // Immediate execution for leading edge or max wait
    if (shouldInvokeLeading || shouldInvokeMaxWait) {
      setDebouncedValue(value);
      lastInvokeTimeRef.current = now;
      return;
    }

    // Set up trailing execution
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastInvokeTimeRef.current = Date.now();
      }, delay);
    }

    // Set up max wait timeout
    if (maxWait && timeSinceLastInvoke < maxWait) {
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastInvokeTimeRef.current = Date.now();
      }, maxWait - timeSinceLastInvoke);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return debouncedValue;
}

/**
 * Hook for debouncing async operations
 * Useful for API calls, search queries, etc.
 */
export function useAsyncDebounce<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  delay: number
): {
  execute: T;
  cancel: () => void;
  isPending: boolean;
} {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingPromiseRef = useRef<Promise<any> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsPending(false);
  }, []);

  const execute = useCallback(
    ((...args: Parameters<T>) => {
      cancel(); // Cancel any pending execution
      setIsPending(true);

      return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await asyncFunction(...args);
            setIsPending(false);
            resolve(result);
          } catch (error) {
            setIsPending(false);
            reject(error);
          }
        }, delay);
      });
    }) as T,
    [asyncFunction, delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    execute,
    cancel,
    isPending,
  };
}

/**
 * Hook for throttling a value (limits the rate of updates)
 * Unlike debounce, throttle ensures the function is called at most once per interval
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
}