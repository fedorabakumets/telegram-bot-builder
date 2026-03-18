/**
 * @fileoverview Функция рендеринга шаблона обработчика команд
 * @module templates/command/command.renderer
 */

import type { CommandTemplateParams } from './command.params';
import { commandParamsSchema } from './command.schema';
import { renderPartialTemplate } from '../template-renderer';
import type { SynonymEntry } from '../synonyms/synonyms.params';
import { computeAdjustStr } from '../keyboard/keyboard.renderer';

/**
 * Генерация Python обработчика команды с валидацией параметров
 * @param params - Параметры обработчика команды
 * @returns Сгенерированный Python код обработчика
 */
export function generateCommand(params: CommandTemplateParams): string {
  const validated = commandParamsSchema.parse({
    ...params,
    isPrivateOnly: params.isPrivateOnly ?? false,
    keyboardType: params.keyboardType ?? 'none',
    formatMode: params.formatMode ?? 'none',
    buttons: params.buttons ?? [],
    synonyms: params.synonyms ?? [],
  });

  // Преобразуем string[] → SynonymEntry[] для шаблона synonyms
  const functionName = (params.command ?? '').replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  const synonymEntries: SynonymEntry[] = (params.synonyms ?? [])
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .map(synonym => ({
    synonym,
    nodeId: params.nodeId,
    nodeType: 'command' as const,
    functionName,
    originalCommand: params.command,
  }));

  return renderPartialTemplate('command/command.py.jinja2', {
    ...validated,
    synonymEntries,
    adjustStr: computeAdjustStr(params.keyboardLayout),
  });
}
