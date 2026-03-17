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

/** Строит параметры из данных узла */
export function buildParseModeParams(node: any, indent?: string): ParseModeTemplateParams {
  return {
    formatMode: node.data.formatMode,
    markdown: node.data.markdown,
    indentLevel: indent,
  };
}
