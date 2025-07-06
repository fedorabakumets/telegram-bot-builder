// Performance utilities for better loading speed

// Image lazy loading utility
export function createImageLoader() {
  const imageCache = new Map<string, HTMLImageElement>();
  
  return {
    preload: (src: string): Promise<void> => {
      if (imageCache.has(src)) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    
    getFromCache: (src: string) => imageCache.get(src),
    
    clear: () => imageCache.clear()
  };
}

// Debounce utility for performance-critical operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory cleanup utility
export function createMemoryManager() {
  const cleanupTasks: (() => void)[] = [];
  
  return {
    addCleanupTask: (task: () => void) => {
      cleanupTasks.push(task);
    },
    
    cleanup: () => {
      cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn('Cleanup task failed:', error);
        }
      });
      cleanupTasks.length = 0;
    }
  };
}

// Bundle size analyzer (development only)
export function logBundleInfo() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Performance Info:');
    console.log(`React version: ${React.version}`);
    console.log(`User agent: ${navigator.userAgent}`);
    console.log(`Memory usage: ${(performance as any).memory?.usedJSHeapSize ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 'N/A'}`);
  }
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback for older browsers
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {}
    };
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}