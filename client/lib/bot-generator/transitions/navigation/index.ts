/**
 * @fileoverview Бочка для модуля navigation
 * 
 * Экспортирует функции генерации навигации.
 * 
 * @module bot-generator/transitions/navigation
 */

export { generateNavigationToNode, type NavigationToNodeParams } from './generate-navigation-to-node';
export { generateNavigationErrorHandler, generateUnknownNodeWarning, generateNoNodesAvailableWarning } from './generate-navigation-error-handler';
