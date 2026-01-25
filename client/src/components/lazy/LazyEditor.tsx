/**
 * Lazy-loaded Editor Components
 * 
 * This module provides lazy-loaded versions of heavy editor components
 * to improve initial page load performance and code splitting.
 */

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Lazy load heavy editor components
const LazyCanvas = React.lazy(() => 
  import('@/components/editor/canvas').then(module => ({ default: module.Canvas }))
);

const LazyPropertiesPanel = React.lazy(() => 
  import('@/components/editor/properties-panel').then(module => ({ default: module.PropertiesPanel }))
);

const LazyCodePanel = React.lazy(() => 
  import('@/components/editor/code-panel').then(module => ({ default: module.CodePanel }))
);

const LazyExportPanel = React.lazy(() => 
  import('@/components/editor/export-panel').then(module => ({ default: module.ExportPanel }))
);

const LazyConnectionManagerPanel = React.lazy(() => 
  import('@/components/editor/connection-manager-panel').then(module => ({ default: module.ConnectionManagerPanel }))
);

const LazyUserDatabasePanel = React.lazy(() => 
  import('@/components/editor/user-database-panel').then(module => ({ default: module.UserDatabasePanel }))
);

const LazyDialogPanel = React.lazy(() => 
  import('@/components/editor/dialog-panel').then(module => ({ default: module.DialogPanel }))
);

const LazyGroupsPanel = React.lazy(() => 
  import('@/components/editor/groups-panel').then(module => ({ default: module.GroupsPanel }))
);

/**
 * Skeleton components for loading states
 */
const CanvasSkeleton = React.memo(() => (
  <div className="h-full w-full bg-background border border-border rounded-lg p-4">
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Simulate canvas nodes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-32">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

CanvasSkeleton.displayName = 'CanvasSkeleton';

const PanelSkeleton = React.memo<{ className?: string }>(({ className }) => (
  <div className={cn("h-full w-full bg-background border border-border rounded-lg p-4", className)}>
    <Skeleton className="h-6 w-1/2 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  </div>
));

PanelSkeleton.displayName = 'PanelSkeleton';

const CodePanelSkeleton = React.memo(() => (
  <div className="h-full w-full bg-background border border-border rounded-lg">
    <div className="border-b border-border p-3">
      <Skeleton className="h-5 w-24" />
    </div>
    <div className="p-4 space-y-2">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-1/2" : "w-5/6")} />
      ))}
    </div>
  </div>
));

CodePanelSkeleton.displayName = 'CodePanelSkeleton';

/**
 * Lazy-loaded Canvas component with optimized loading
 */
export const Canvas = React.memo<React.ComponentProps<typeof LazyCanvas>>((props) => (
  <Suspense fallback={<CanvasSkeleton />}>
    <LazyCanvas {...props} />
  </Suspense>
));

Canvas.displayName = 'LazyCanvas';

/**
 * Lazy-loaded Properties Panel component
 */
export const PropertiesPanel = React.memo<React.ComponentProps<typeof LazyPropertiesPanel>>((props) => (
  <Suspense fallback={<PanelSkeleton />}>
    <LazyPropertiesPanel {...props} />
  </Suspense>
));

PropertiesPanel.displayName = 'LazyPropertiesPanel';

/**
 * Lazy-loaded Code Panel component
 */
export const CodePanel = React.memo<React.ComponentProps<typeof LazyCodePanel>>((props) => (
  <Suspense fallback={<CodePanelSkeleton />}>
    <LazyCodePanel {...props} />
  </Suspense>
));

CodePanel.displayName = 'LazyCodePanel';

/**
 * Lazy-loaded Export Panel component
 */
export const ExportPanel = React.memo<React.ComponentProps<typeof LazyExportPanel>>((props) => (
  <Suspense fallback={<PanelSkeleton />}>
    <LazyExportPanel {...props} />
  </Suspense>
));

ExportPanel.displayName = 'LazyExportPanel';

/**
 * Lazy-loaded Connection Manager Panel component
 */
export const ConnectionManagerPanel = React.memo<React.ComponentProps<typeof LazyConnectionManagerPanel>>((props) => (
  <Suspense fallback={<PanelSkeleton />}>
    <LazyConnectionManagerPanel {...props} />
  </Suspense>
));

ConnectionManagerPanel.displayName = 'LazyConnectionManagerPanel';

/**
 * Lazy-loaded User Database Panel component
 */
export const UserDatabasePanel = React.memo<React.ComponentProps<typeof LazyUserDatabasePanel>>((props) => (
  <Suspense fallback={<PanelSkeleton />}>
    <LazyUserDatabasePanel {...props} />
  </Suspense>
));

UserDatabasePanel.displayName = 'LazyUserDatabasePanel';

/**
 * Lazy-loaded Dialog Panel component
 */
export const DialogPanel = React.memo<React.ComponentProps<typeof LazyDialogPanel>>((props) => (
  <Suspense fallback={<PanelSkeleton />}>
    <LazyDialogPanel {...props} />
  </Suspense>
));

DialogPanel.displayName = 'LazyDialogPanel';

/**
 * Lazy-loaded Groups Panel component
 */
export const GroupsPanel = React.memo<React.ComponentProps<typeof LazyGroupsPanel>>((props) => (
  <Suspense fallback={<PanelSkeleton />}>
    <LazyGroupsPanel {...props} />
  </Suspense>
));

GroupsPanel.displayName = 'LazyGroupsPanel';

/**
 * Higher-order component for adding lazy loading to any component
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param fallback Fallback component to show while loading
 * @returns Lazy-loaded component with Suspense wrapper
 * 
 * @example
 * ```tsx
 * const LazyMyComponent = withLazyLoading(
 *   () => import('./MyComponent'),
 *   <MyComponentSkeleton />
 * );
 * ```
 */
export function withLazyLoading<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <Skeleton className="h-32 w-full" />
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFn);
  
  return React.memo((props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  ));
}

/**
 * Preload function for eager loading of editor components
 * Call this function to preload components before they're needed
 * 
 * @example
 * ```tsx
 * // Preload on user interaction or route change
 * function handleEditorButtonClick() {
 *   preloadEditorComponents();
 *   navigateToEditor();
 * }
 * ```
 */
export function preloadEditorComponents(): void {
  // Preload all editor components
  const preloadPromises = [
    import('@/components/editor/canvas'),
    import('@/components/editor/properties-panel'),
    import('@/components/editor/code-panel'),
    import('@/components/editor/export-panel'),
    import('@/components/editor/connection-manager-panel'),
    import('@/components/editor/user-database-panel'),
    import('@/components/editor/dialog-panel'),
    import('@/components/editor/groups-panel'),
  ];

  // Preload in background without blocking
  Promise.all(preloadPromises).catch((error) => {
    console.warn('Failed to preload some editor components:', error);
  });
}

/**
 * Hook for preloading components on demand
 * 
 * @param shouldPreload Whether to start preloading
 * @returns Object with preload function and loading state
 * 
 * @example
 * ```tsx
 * function EditorButton() {
 *   const { preload, isPreloading } = usePreloadComponents();
 *   
 *   return (
 *     <Button 
 *       onMouseEnter={preload}
 *       onClick={navigateToEditor}
 *       disabled={isPreloading}
 *     >
 *       Open Editor
 *     </Button>
 *   );
 * }
 * ```
 */
export function usePreloadComponents(shouldPreload = false) {
  const [isPreloading, setIsPreloading] = React.useState(false);
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  const preload = React.useCallback(async () => {
    if (isPreloaded || isPreloading) return;
    
    setIsPreloading(true);
    try {
      await Promise.all([
        import('@/components/editor/canvas'),
        import('@/components/editor/properties-panel'),
        import('@/components/editor/code-panel'),
        import('@/components/editor/export-panel'),
      ]);
      setIsPreloaded(true);
    } catch (error) {
      console.warn('Failed to preload components:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [isPreloaded, isPreloading]);

  React.useEffect(() => {
    if (shouldPreload) {
      preload();
    }
  }, [shouldPreload, preload]);

  return {
    preload,
    isPreloading,
    isPreloaded,
  };
}

export default {
  Canvas,
  PropertiesPanel,
  CodePanel,
  ExportPanel,
  ConnectionManagerPanel,
  UserDatabasePanel,
  DialogPanel,
  GroupsPanel,
  withLazyLoading,
  preloadEditorComponents,
  usePreloadComponents,
};