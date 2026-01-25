/**
 * Optimized Context Utilities
 * 
 * Utilities for creating performance-optimized React contexts with memoization
 * and selective re-rendering capabilities.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';

/**
 * Options for creating an optimized context
 */
export interface OptimizedContextOptions<T> {
  /** Display name for the context (for debugging) */
  displayName?: string;
  /** Default value for the context */
  defaultValue?: T;
  /** Custom equality function for value comparison */
  isEqual?: (prev: T, next: T) => boolean;
}

/**
 * Result of creating an optimized context
 */
export interface OptimizedContextResult<T> {
  /** Context object */
  Context: React.Context<T | undefined>;
  /** Provider component */
  Provider: React.FC<{ value: T; children: React.ReactNode }>;
  /** Hook to consume the context */
  useContext: () => T;
}

/**
 * Default shallow equality function
 */
function shallowEqual<T>(prev: T, next: T): boolean {
  if (prev === next) return true;
  
  if (typeof prev !== 'object' || typeof next !== 'object' || prev === null || next === null) {
    return false;
  }
  
  const prevKeys = Object.keys(prev as object);
  const nextKeys = Object.keys(next as object);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  for (const key of prevKeys) {
    if (!(key in (next as object)) || (prev as any)[key] !== (next as any)[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Creates an optimized React context with memoized provider and selective re-rendering
 * 
 * @param options Configuration options for the context
 * @returns Object containing Context, Provider, and useContext hook
 * 
 * @example
 * ```tsx
 * interface ThemeContextValue {
 *   theme: 'light' | 'dark';
 *   toggleTheme: () => void;
 * }
 * 
 * const { Provider: ThemeProvider, useContext: useTheme } = createOptimizedContext<ThemeContextValue>({
 *   displayName: 'Theme',
 *   isEqual: shallowEqual,
 * });
 * 
 * function App() {
 *   const [theme, setTheme] = useState<'light' | 'dark'>('light');
 *   
 *   const contextValue = useMemo(() => ({
 *     theme,
 *     toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
 *   }), [theme]);
 *   
 *   return (
 *     <ThemeProvider value={contextValue}>
 *       <MyComponent />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export function createOptimizedContext<T>({
  displayName = 'OptimizedContext',
  defaultValue,
  isEqual = shallowEqual,
}: OptimizedContextOptions<T> = {}): OptimizedContextResult<T> {
  const Context = createContext<T | undefined>(defaultValue);
  Context.displayName = displayName;

  const Provider = React.memo<{ value: T; children: React.ReactNode }>(
    ({ value, children }) => {
      // Memoize the context value to prevent unnecessary re-renders
      const memoizedValue = useMemo(() => value, [value]);

      return (
        <Context.Provider value={memoizedValue}>
          {children}
        </Context.Provider>
      );
    },
    (prevProps, nextProps) => {
      // Use custom equality function to determine if re-render is needed
      return isEqual(prevProps.value, nextProps.value) && prevProps.children === nextProps.children;
    }
  );

  Provider.displayName = `${displayName}Provider`;

  const useOptimizedContext = (): T => {
    const context = useContext(Context);
    
    if (context === undefined) {
      throw new Error(`use${displayName} must be used within a ${displayName}Provider`);
    }
    
    return context;
  };

  return {
    Context,
    Provider,
    useContext: useOptimizedContext,
  };
}

/**
 * Hook for creating memoized context values with stable references
 * 
 * @param factory Function that creates the context value
 * @param deps Dependency array for memoization
 * @returns Memoized context value
 * 
 * @example
 * ```tsx
 * function MyProvider({ children }: { children: React.ReactNode }) {
 *   const [state, setState] = useState(initialState);
 *   
 *   const contextValue = useMemoizedContextValue(() => ({
 *     state,
 *     updateState: (newState: Partial<State>) => setState(prev => ({ ...prev, ...newState })),
 *     resetState: () => setState(initialState),
 *   }), [state]);
 *   
 *   return (
 *     <MyContext.Provider value={contextValue}>
 *       {children}
 *     </MyContext.Provider>
 *   );
 * }
 * ```
 */
export function useMemoizedContextValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Hook for creating stable callback functions in context values
 * 
 * @param callback The callback function
 * @param deps Dependency array for the callback
 * @returns Memoized callback function
 * 
 * @example
 * ```tsx
 * function MyProvider({ children }: { children: React.ReactNode }) {
 *   const [items, setItems] = useState<Item[]>([]);
 *   
 *   const addItem = useStableCallback((item: Item) => {
 *     setItems(prev => [...prev, item]);
 *   }, []);
 *   
 *   const removeItem = useStableCallback((id: string) => {
 *     setItems(prev => prev.filter(item => item.id !== id));
 *   }, []);
 *   
 *   const contextValue = useMemo(() => ({
 *     items,
 *     addItem,
 *     removeItem,
 *   }), [items, addItem, removeItem]);
 *   
 *   return (
 *     <MyContext.Provider value={contextValue}>
 *       {children}
 *     </MyContext.Provider>
 *   );
 * }
 * ```
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Utility for splitting context into multiple contexts to reduce re-renders
 * Useful when you have a large context with frequently changing and rarely changing values
 * 
 * @example
 * ```tsx
 * // Instead of one large context
 * interface AppContextValue {
 *   user: User;           // Changes rarely
 *   theme: Theme;         // Changes rarely  
 *   notifications: Notification[]; // Changes frequently
 *   isLoading: boolean;   // Changes frequently
 * }
 * 
 * // Split into multiple contexts
 * const { Provider: UserProvider, useContext: useUser } = createOptimizedContext<{ user: User; theme: Theme }>();
 * const { Provider: UIProvider, useContext: useUI } = createOptimizedContext<{ notifications: Notification[]; isLoading: boolean }>();
 * 
 * function App() {
 *   return (
 *     <UserProvider value={{ user, theme }}>
 *       <UIProvider value={{ notifications, isLoading }}>
 *         <MyComponent />
 *       </UIProvider>
 *     </UserProvider>
 *   );
 * }
 * ```
 */
export function createSplitContext<T extends Record<string, any>>(
  contextName: string,
  keys: (keyof T)[]
): {
  [K in keyof T]: OptimizedContextResult<Pick<T, K>>;
} {
  const contexts = {} as any;
  
  for (const key of keys) {
    contexts[key] = createOptimizedContext<Pick<T, typeof key>>({
      displayName: `${contextName}${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`,
    });
  }
  
  return contexts;
}

/**
 * Higher-order component for providing multiple contexts
 * 
 * @param providers Array of provider components with their values
 * @returns Combined provider component
 * 
 * @example
 * ```tsx
 * const CombinedProvider = combineProviders([
 *   { Provider: ThemeProvider, value: themeValue },
 *   { Provider: UserProvider, value: userValue },
 *   { Provider: NotificationProvider, value: notificationValue },
 * ]);
 * 
 * function App() {
 *   return (
 *     <CombinedProvider>
 *       <MyComponent />
 *     </CombinedProvider>
 *   );
 * }
 * ```
 */
export function combineProviders<T extends Array<{ Provider: React.ComponentType<any>; value: any }>>(
  providers: T
): React.FC<{ children: React.ReactNode }> {
  return React.memo(({ children }) => {
    return providers.reduceRight(
      (acc, { Provider, value }) => (
        <Provider value={value}>{acc}</Provider>
      ),
      children as React.ReactElement
    );
  });
}

export default {
  createOptimizedContext,
  useMemoizedContextValue,
  useStableCallback,
  createSplitContext,
  combineProviders,
  shallowEqual,
};