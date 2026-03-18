/**
 * @fileoverview Функция рендеринга шаблона handle_node_* функций
 * @module templates/handle-node-function/handle-node-function.renderer
 */

import type { EnhancedNode } from '../../bot-generator/types';
import { renderPartialTemplate } from '../template-renderer';
import { handleNodeFunctionParamsSchema } from './handle-node-function.schema';
import type { HandleNodeFunctionParams, HandleNodeFunctionsParams } from './handle-node-function.params';

/**
 * Генерирует одну handle_node_* функцию с валидацией параметров
 * @param params - Параметры одного узла
 * @returns Сгенерированный Python код функции
 */
export function generateHandleNodeFunction(params: HandleNodeFunctionParams): string {
  const validated = handleNodeFunctionParamsSchema.parse(params);
  return renderPartialTemplate('handle-node-function/handle-node-function.py.jinja2', {
    nodes: [validated],
  });
}

/**
 * Генерирует все handle_node_* функции из массива параметров
 * @param params - Параметры всех узлов
 * @returns Сгенерированный Python код всех функций
 */
export function generateHandleNodeFunctionsFromParams(params: HandleNodeFunctionsParams): string {
  const validated = params.nodes.map(n => handleNodeFunctionParamsSchema.parse(n));
  return renderPartialTemplate('handle-node-function/handle-node-function.py.jinja2', {
    nodes: validated,
  });
}

/**
 * Преобразует EnhancedNode в HandleNodeFunctionParams
 */
function nodeToParams(node: EnhancedNode): HandleNodeFunctionParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  // Извлекаем переменные из текста сообщения
  const messageText = node.data?.messageText || '';
  const usedVariables = messageText
    ? [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map(m => m[1])
    : [];

  const attachedMedia: string[] = node.data?.attachedMedia ?? [];

  return {
    nodeId: node.id,
    safeName,
    messageText: node.data?.messageText || '',
    formatMode: node.data?.formatMode || 'none',
    imageUrl: node.data?.imageUrl || '',
    attachedMedia,
    enableConditionalMessages: node.data?.enableConditionalMessages ?? false,
    conditionalMessages: node.data?.conditionalMessages ?? [],
    variableFiltersJson: JSON.stringify(node.data?.variableFilters || {}),
    enableAutoTransition: node.data?.enableAutoTransition ?? false,
    autoTransitionTo: node.data?.autoTransitionTo
      ? String(node.data.autoTransitionTo).replace(/[^a-zA-Z0-9_]/g, '_')
      : '',
    collectUserInput: node.data?.collectUserInput ?? false,
    inputType: node.data?.inputType || 'text',
    inputTargetNodeId: node.data?.inputTargetNodeId || '',
    usedVariables,
  };
}

/**
 * Генерирует handle_node_* функции из массива EnhancedNode
 * Фильтрует только узлы с условными сообщениями и сбором ввода
 *
 * @param nodes - Массив всех узлов
 * @param mediaVariablesMap - Карта переменных медиа
 * @returns Сгенерированный Python код
 */
export function generateHandleNodeFunctions(
  nodes: EnhancedNode[],
  _mediaVariablesMap: Map<string, { type: string; variable: string }>
): string {
  const conditionalNodes = nodes.filter(
    node =>
      node &&
      node.data?.enableConditionalMessages &&
      node.data?.conditionalMessages?.length > 0 &&
      node.data?.collectUserInput === true
  );

  if (conditionalNodes.length === 0) return '';

  const params = conditionalNodes.map(n => nodeToParams(n));
  return renderPartialTemplate('handle-node-function/handle-node-function.py.jinja2', {
    nodes: params.map(p => handleNodeFunctionParamsSchema.parse(p)),
  });
}
