import { lazy, Suspense, ComponentType } from 'react';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Generic lazy loading wrapper
export function withLazyLoading<T extends {}>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback: ComponentType = LoadingSpinner
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: T) => (
    <Suspense fallback={<fallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Preload function for critical components
export function preloadComponent(importFunc: () => Promise<any>) {
  const componentImport = importFunc();
  // Store the promise to avoid duplicate imports
  return componentImport;
}