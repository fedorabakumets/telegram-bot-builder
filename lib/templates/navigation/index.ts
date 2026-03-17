/**
 * @fileoverview Бочка для шаблона navigate-to-node
 * @module templates/navigation
 */

export {
  generateNavigateToNode,
  generateNavigateToNodeCall,
  generateNavigateToNodeWithText,
} from './navigate-to-node.renderer';
export { navigateToNodeParamsSchema } from './navigate-to-node.schema';
export type { NavigateToNodeTemplateParams } from './navigate-to-node.params';
export type { NavigateToNodeParams } from './navigate-to-node.schema';
export * from './navigate-to-node.fixture';
