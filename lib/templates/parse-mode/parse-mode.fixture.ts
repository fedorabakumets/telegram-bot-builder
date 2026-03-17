/**
 * @fileoverview Тестовые данные для шаблона parse-mode
 * @module templates/parse-mode/parse-mode.fixture
 */

import type { ParseModeTemplateParams } from './parse-mode.params';

/** Валидные параметры: markdown */
export const validParamsMarkdown: ParseModeTemplateParams = {
  formatMode: 'markdown',
};

/** Валидные параметры: html */
export const validParamsHtml: ParseModeTemplateParams = {
  formatMode: 'html',
};

/** Валидные параметры: без форматирования */
export const validParamsNone: ParseModeTemplateParams = {};

/** Валидные параметры: устаревший флаг markdown */
export const validParamsMarkdownFlag: ParseModeTemplateParams = {
  markdown: true,
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: ParseModeTemplateParams = {
  formatMode: 'html',
  indentLevel: '    ',
};
