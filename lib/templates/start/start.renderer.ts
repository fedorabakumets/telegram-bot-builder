/**
 * @fileoverview Функция рендеринга шаблона обработчика /start
 * @module templates/start/start.renderer
 */

import type { StartTemplateParams } from './start.params';
import { startParamsSchema } from './start.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { SynonymEntry } from '../synonyms/synonyms.params';
import { computeAdjustStr } from '../keyboard/keyboard.renderer';
import { generateUserInput, nodeToUserInputParams } from '../user-input/user-input.renderer';
import type { Node } from '@shared/schema';

/**
 * Генерация Python обработчика команды /start с валидацией параметров.
 *
 * Генерирует два обработчика:
 * - `@dp.message(CommandStart())` — для команды /start
 * - `@dp.callback_query(lambda c: c.data == "start")` — для кнопок
 *   с `action: "goto"` и `target: "start"` (например, "⬅ Назад в меню")
 *
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
  const synonymEntries: SynonymEntry[] = (params.synonyms ?? [])
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .map(synonym => ({
    synonym,
    nodeId: params.nodeId,
    nodeType: 'start' as const,
    functionName: 'start',
    originalCommand: '/start',
  }));

  // Вычисляем блок waiting_for_input если нужен сбор ввода
  let userInputBlock = '';
  if (params.collectUserInput) {
    const fakeNode = {
      id: params.nodeId,
      type: 'start',
      position: { x: 0, y: 0 },
      data: params as any,
    } as Node;
    userInputBlock = generateUserInput(nodeToUserInputParams(fakeNode));
  }

  return renderPartialTemplate('start/start.py.jinja2', {
    ...validated,
    synonymEntries,
    handlerContext: 'message',
    adjustStr: computeAdjustStr(params.keyboardLayout),
    userInputBlock,
  });
}
