/**
 * @fileoverview Бочка для шаблона auto-transition
 * @module templates/auto-transition
 */

export {
  generateAutoTransition,
  calculateAutoTransitionTarget,
} from './auto-transition.renderer';
export { autoTransitionParamsSchema } from './auto-transition.schema';
export type { AutoTransitionTemplateParams } from './auto-transition.params';
export type { AutoTransitionParams } from './auto-transition.schema';
export * from './auto-transition.fixture';
