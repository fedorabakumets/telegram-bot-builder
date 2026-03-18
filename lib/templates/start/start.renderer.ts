/**
 * @fileoverview Функция рендеринга шаблона обработчика /start
 * @module templates/start/start.renderer
 */

import type { StartTemplateParams } from './start.params';
import { startParamsSchema } from './start.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { SynonymEntry } from '../synonyms/synonyms.params';
import { computeAdjustStr } from '../keyboard/keyboard.renderer';

/**
 * Генерация Python обработчика команды /start с валидацией параметров
 * @param params - Параметры обработчика /start
 * @returns Сгенерированный Python код обработчика
 */
export function generateStart(params: StartTemplateParams): string {
  const validated = startParamsSchema.parse({
    ...params,
    isPrivateOnly: params.isPrivateOnly ?? false,
    keyboardType: params.keyboardType ?? 'none',
    formatMode: params.formatMode ?? 'none',
  });

  // Преобразуем string[] → SynonymEntry[] для шаблона synonyms
  const synonymEntries: SynonymEntry[] = (params.synonyms ?? []).map(synonym => ({
    synonym,
    nodeId: params.nodeId,
    nodeType: 'start' as const,
    functionName: 'start',
    originalCommand: '/start',
  }));

  return renderPartialTemplate('start/start.py.jinja2', {
    ...validated,
    synonymEntries,
    handlerContext: 'message',
    adjustStr: computeAdjustStr(params.keyboardLayout),
  });
}
