/**
 * Lazy Loading Components Index
 * 
 * Central export point for all lazy-loaded components and utilities
 */

// Lazy Editor Components
export {
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
} from './LazyEditor';

// Lazy Route Components
export {
  Home,
  Editor,
  EditorSimple,
  Templates,
  RoutePreloader,
  useRoutePreloader,
} from './LazyRoutes';

// Re-export default objects
export { default as LazyEditor } from './LazyEditor';
export { default as LazyRoutes } from './LazyRoutes';