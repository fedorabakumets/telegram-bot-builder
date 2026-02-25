/**
 * @fileoverview Утилита для генерации API конфигурации
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего конфигурацию API для бота (таймауты, SSL и т.д.)
 *
 * @module generateApiConfig
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует код конфигурации API
 * @returns Строка с кодом конфигурации API
 */
export function generateApiConfig(): string {
  const codeLines: string[] = [];

  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │        Конфигурация API                 │');
  codeLines.push('# └─────────────────────────────────────────┘');
  codeLines.push('# Таймаут запросов к API (секунды)');
  codeLines.push('API_TIMEOUT = int(os.getenv("API_TIMEOUT", "10"))');
  codeLines.push('');
  codeLines.push('# Использование SSL для API');
  codeLines.push('API_USE_SSL = os.getenv("API_USE_SSL", "auto").lower()');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateApiConfig.ts');

  return commentedCodeLines.join('\n');
}
