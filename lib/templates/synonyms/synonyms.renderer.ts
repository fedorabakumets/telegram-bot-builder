/**
 * @fileoverview Функция рендеринга шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.renderer
 */

import type { SynonymsTemplateParams } from './synonyms.params';
import { synonymsParamsSchema } from './synonyms.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчиков синонимов с валидацией параметров
 * @param params - Параметры синонимов
 * @returns Сгенерированный Python код обработчиков
 *
 * @example
 * ```typescript
 * const code = generateSynonyms({
 *   synonyms: [
 *     { synonym: 'привет', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
 *     { synonym: 'помощь', nodeId: 'cmd_1', nodeType: 'command', functionName: 'help', originalCommand: '/help' },
 *   ],
 * });
 * ```
 */
export function generateSynonyms(params: SynonymsTemplateParams): string {
  if (params.synonyms.length === 0) return '';
  const validated = synonymsParamsSchema.parse(params);
  return renderPartialTemplate('synonyms/synonyms.py.jinja2', { synonymEntries: validated.synonyms });
}
