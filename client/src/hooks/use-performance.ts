import { useEffect, useCallback, useRef } from 'react';
import { debounce, throttle, createMemoryManager } from '@/utils/performance';

// Performance monitoring hook
export function usePerformanceMonitor() {
  const memoryManager = useRef(createMemoryManager());

  useEffect(() => {
    const cleanup = memoryManager.current;
    
    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        if ((performance as any).memory) {
          const memory = (performance as any).memory;
          const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
          const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
          
          if (used > 100) { // Alert if memory usage is high
            console.warn(`High memory usage: ${used}MB / ${total}MB`);
          }
        }
      }, 30000); // Check every 30 seconds
      
      cleanup.addCleanupTask(() => clearInterval(interval));
    }

    return () => cleanup.cleanup();
  }, []);

  return memoryManager.current;
}

// Optimized scroll handler hook
export function useOptimizedScroll(
  callback: (scrollTop: number) => void,
  deps: any[] = []
) {
  const throttledCallback = useCallback(
    throttle((e: Event) => {
      const target = e.target as HTMLElement;
      callback(target.scrollTop);
    }, 16), // 60fps
    deps
  );

  useEffect(() => {
    return () => {
      // Cleanup is handled by throttle function
    };
  }, [throttledCallback]);

  return throttledCallback;
}

// Optimized resize handler hook
export function useOptimizedResize(
  callback: (width: number, height: number) => void,
  deps: any[] = []
) {
  const debouncedCallback = useCallback(
    debounce(() => {
      callback(window.innerWidth, window.innerHeight);
    }, 150),
    deps
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedCallback);
    
    return () => {
      window.removeEventListener('resize', debouncedCallback);
    };
  }, [debouncedCallback]);

  return debouncedCallback;
}

// Hook for measuring component render performance
export function useRenderMetrics(componentName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;
  });

  useEffect(() => {
    if (renderStart.current && process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - renderStart.current;
      
      if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps)
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    logMetrics: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} metrics:`, {
          renders: renderCount.current,
          avgRenderTime: renderStart.current ? performance.now() - renderStart.current : 0
        });
      }
    }
  };
}