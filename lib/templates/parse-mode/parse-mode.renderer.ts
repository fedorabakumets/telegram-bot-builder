/**
 * @fileoverview Renderer для шаблона parse-mode
 * @module templates/parse-mode/parse-mode.renderer
 */

import type { ParseModeTemplateParams } from './parse-mode.params';
import { parseModeParamsSchema } from './parse-mode.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код выбора parse_mode.
 * @param params - Параметры parse mode
 * @returns Сгенерированный Python код
 */
export function generateParseMode(params: ParseModeTemplateParams): string {
  const validated = parseModeParamsSchema.parse(params);
  return renderPartialTemplate('parse-mode/parse-mode.py.jinja2', validated);
}

/** Строит параметры из данных узла.
 * Если одновременно заданы `markdown: true` и `formatMode` (не 'none') —
 * логирует предупреждение: `formatMode` имеет приоритет.
 * @param node - Узел графа с полем `data`
 * @param indent - Строка отступа для генерируемого кода
 * @returns Параметры шаблона parse-mode
 */
export function buildParseModeParams(node: any, indent?: string): ParseModeTemplateParams {
  if (node.data.markdown && node.data.formatMode && node.data.formatMode !== 'none') {
    console.warn(
      `[parse-mode] Конфликт: markdown=true и formatMode="${node.data.formatMode}" ` +
      `для узла ${node.id}. Используется formatMode.`
    );
  }
  return {
    formatMode: node.data.formatMode,
    markdown: node.data.markdown,
    indentLevel: indent,
  };
}
