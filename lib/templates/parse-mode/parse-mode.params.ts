/**
 * @fileoverview Параметры шаблона выбора parse_mode
 * @module templates/parse-mode/parse-mode.params
 */

/** Параметры для генерации блока выбора parse_mode */
export interface ParseModeTemplateParams {
  /** Режим форматирования: 'markdown', 'html' или пусто */
  formatMode?: 'markdown' | 'html' | string;
  /** Устаревший флаг Markdown (используйте formatMode) */
  markdown?: boolean;
  /** Строка отступа для генерируемого кода */
  indentLevel?: string;
}
