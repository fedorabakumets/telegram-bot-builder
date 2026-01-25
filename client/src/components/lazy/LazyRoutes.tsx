/**
 * Lazy Route Components
 * 
 * This module provides lazy-loaded route components with optimized loading
 * and error boundaries for better performance and user experience.
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw, Home as HomeIcon } from 'lucide-react';

// Lazy load page components
const LazyHome = React.lazy(() => import('@/pages/home'));
const LazyEditor = React.lazy(() => import('@/pages/LazyEditor'));
const LazyEditorSimple = React.lazy(() => import('@/pages/editor-simple'));
const LazyTemplates = React.lazy(() => import('@/pages/templates'));

/**
 * Loading skeleton components for different page types
 */
const HomePageSkeleton = React.memo(() => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
    
    {/* Main content skeleton */}
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full mb-4" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
));

HomePageSkeleton.displayName = 'HomePageSkeleton';

const EditorPageSkeleton = React.memo(() => (
  <div className="h-screen flex flex-col">
    {/* Header skeleton */}
    <div className="h-14 bg-background border-b border-border flex items-center px-4">
      <Skeleton className="h-8 w-32 mr-4" />
      <div className="flex space-x-2 ml-auto">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    
    {/* Main editor skeleton */}
    <div className="flex-1 flex">
      {/* Left sidebar */}
      <div className="w-64 border-r border-border p-4">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Canvas area */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right sidebar */}
      <div className="w-80 border-l border-border p-4">
        <Skeleton className="h-6 w-1/2 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

EditorPageSkeleton.displayName = 'EditorPageSkeleton';

const TemplatesPageSkeleton = React.memo(() => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
    
    {/* Templates grid skeleton */}
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
));

TemplatesPageSkeleton.displayName = 'TemplatesPageSkeleton';

/**
 * Error fallback component for route errors
 */
const RouteErrorFallback = React.memo<{
  error: Error;
  resetErrorBoundary: () => void;
  routeName?: string;
}>(({ error, resetErrorBoundary, routeName = 'страницы' }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-red-600 dark:text-red-400">
          Ошибка загрузки {routeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Произошла ошибка при загрузке компонентов. Попробуйте обновить страницу или вернуться позже.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Детали ошибки
            </summary>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="flex space-x-2">
          <Button onClick={resetErrorBoundary} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
));

RouteErrorFallback.displayName = 'RouteErrorFallback';

/**
 * Higher-order component for wrapping routes with lazy loading and error boundaries
 */
function withLazyRoute<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode,
  routeName?: string
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFn);
  
  return React.memo((props) => (
    <ErrorBoundary
      FallbackComponent={(errorProps) => (
        <RouteErrorFallback {...errorProps} routeName={routeName} />
      )}
      onError={(error, errorInfo) => {
        console.error(`Error in ${routeName || 'route'}:`, error, errorInfo);
        // Here you could send error to monitoring service
      }}
    >
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  ));
}

/**
 * Lazy-loaded route components with optimized loading states
 */
export const Home = withLazyRoute(
  () => import('@/pages/home'),
  <HomePageSkeleton />,
  'главной страницы'
);

export const Editor = withLazyRoute(
  () => import('@/pages/LazyEditor'),
  <EditorPageSkeleton />,
  'редактора'
);

export const EditorSimple = withLazyRoute(
  () => import('@/pages/editor-simple'),
  <EditorPageSkeleton />,
  'простого редактора'
);

export const Templates = withLazyRoute(
  () => import('@/pages/templates'),
  <TemplatesPageSkeleton />,
  'шаблонов'
);

/**
 * Route preloader utility
 * Preloads route components in the background
 */
export class RoutePreloader {
  private static preloadedRoutes = new Set<string>();
  
  /**
   * Preload a specific route
   */
  static async preloadRoute(routeName: 'home' | 'editor' | 'editor-simple' | 'templates'): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) return;
    
    try {
      switch (routeName) {
        case 'home':
          await import('@/pages/home');
          break;
        case 'editor':
          await import('@/pages/LazyEditor');
          break;
        case 'editor-simple':
          await import('@/pages/editor-simple');
          break;
        case 'templates':
          await import('@/pages/templates');
          break;
      }
      this.preloadedRoutes.add(routeName);
    } catch (error) {
      console.warn(`Failed to preload route ${routeName}:`, error);
    }
  }
  
  /**
   * Preload all routes
   */
  static async preloadAllRoutes(): Promise<void> {
    const routes: Array<'home' | 'editor' | 'editor-simple' | 'templates'> = [
      'home', 'editor', 'editor-simple', 'templates'
    ];
    
    await Promise.allSettled(
      routes.map(route => this.preloadRoute(route))
    );
  }
  
  /**
   * Check if a route is preloaded
   */
  static isPreloaded(routeName: string): boolean {
    return this.preloadedRoutes.has(routeName);
  }
}

/**
 * Hook for preloading routes on user interaction
 */
export function useRoutePreloader() {
  const [preloadedRoutes, setPreloadedRoutes] = React.useState<Set<string>>(new Set());
  
  const preloadRoute = React.useCallback(async (routeName: 'home' | 'editor' | 'editor-simple' | 'templates') => {
    if (preloadedRoutes.has(routeName)) return;
    
    await RoutePreloader.preloadRoute(routeName);
    setPreloadedRoutes(prev => new Set([...prev, routeName]));
  }, [preloadedRoutes]);
  
  const preloadAllRoutes = React.useCallback(async () => {
    await RoutePreloader.preloadAllRoutes();
    setPreloadedRoutes(new Set(['home', 'editor', 'editor-simple', 'templates']));
  }, []);
  
  return {
    preloadRoute,
    preloadAllRoutes,
    isPreloaded: (routeName: string) => preloadedRoutes.has(routeName),
  };
}

export default {
  Home,
  Editor,
  EditorSimple,
  Templates,
  RoutePreloader,
  useRoutePreloader,
};