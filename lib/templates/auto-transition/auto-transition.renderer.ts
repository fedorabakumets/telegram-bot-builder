/**
 * @fileoverview Renderer для шаблона auto-transition
 * @module templates/auto-transition/auto-transition.renderer
 */

import { z } from 'zod';
import type { AutoTransitionTemplateParams } from './auto-transition.params';
import { renderPartialTemplate } from '../template-renderer';

const autoTransitionParamsSchema = z.object({
  nodeId: z.string(),
  autoTransitionTarget: z.string(),
  targetExists: z.boolean(),
  indentLevel: z.string().optional(),
});

/**
 * Генерирует Python-код автоперехода к целевому узлу.
 * Заменяет generateAutoTransitionCode() из bot-generator/transitions/auto-transition-code.ts
 */
export function generateAutoTransition(params: AutoTransitionTemplateParams): string {
  const validated = autoTransitionParamsSchema.parse(params);
  return renderPartialTemplate('auto-transition/auto-transition.py.jinja2', validated);
}

/**
 * Вычисляет цель автоперехода из данных узла и соединений.
 * Заменяет calculateAutoTransitionTarget() из auto-transition-check.ts
 */
export function calculateAutoTransitionTarget(
  nodeId: string,
  nodeData: any,
  connections: any[]
): string | null {
  if (nodeData?.enableAutoTransition && nodeData?.autoTransitionTo) {
    return nodeData.autoTransitionTo;
  }
  if (!nodeData?.buttons || nodeData.buttons.length === 0) {
    const outgoing = connections.filter(c => c && c.source === nodeId);
    if (outgoing.length === 1) return outgoing[0].target;
  }
  return null;
}
