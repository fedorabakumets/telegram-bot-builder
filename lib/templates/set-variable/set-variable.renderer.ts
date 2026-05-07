/**
 * @fileoverview Функции рендеринга шаблона узла set_variable
 * @module templates/set-variable/set-variable.renderer
 */

import type { Node } from '@shared/schema';
import type { SetVariableTemplateParams } from './set-variable.params';
import { setVariableParamsSchema } from './set-variable.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает параметры шаблона для всех узлов типа set_variable.
 * @param nodes - Массив узлов холста
 * @returns Массив SetVariableTemplateParams для генерации кода
 */
export function collectSetVariableEntries(nodes: Node[]): SetVariableTemplateParams[] {
  return nodes
    .filter(n => n != null && n.type === 'set_variable')
    .map(node => ({
      nodeId: node.id,
      assignments: node.data?.assignments || [],
      autoTransitionTo: node.data?.autoTransitionTo || '',
    }));
}

/**
 * Генерирует Python-код обработчиков для всех узлов set_variable.
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateSetVariableHandlers(nodes: Node[]): string {
  const entries = collectSetVariableEntries(nodes);
  if (entries.length === 0) return '';

  return entries
    .map(params => {
      const validated = setVariableParamsSchema.parse(params);
      return renderPartialTemplate('set-variable/set-variable.py.jinja2', validated);
    })
    .join('\n');
}
