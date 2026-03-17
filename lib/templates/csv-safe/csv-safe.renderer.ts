/**
 * @fileoverview Renderer для шаблона csv-safe
 * @module templates/csv-safe/csv-safe.renderer
 */

import type { CsvSafeTemplateParams } from './csv-safe.params';
import { csvSafeParamsSchema } from './csv-safe.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код для безопасной работы с CSV файлами.
 * @param params - Параметры CSV операции
 * @returns Сгенерированный Python код
 */
export function generateCsvSafe(params: CsvSafeTemplateParams): string {
  const validated = csvSafeParamsSchema.parse(params);
  return renderPartialTemplate('csv-safe/csv-safe.py.jinja2', validated);
}

/** Хелпер для записи в CSV */
export function generateSafeCsvWrite(csvFileVar: string, dataVar: string, indent?: string): string {
  return generateCsvSafe({ operation: 'write', csvFileVar, dataVar, indentLevel: indent });
}

/** Хелпер для чтения из CSV */
export function generateSafeCsvRead(csvFileVar: string, resultVar: string, indent?: string): string {
  return generateCsvSafe({ operation: 'read', csvFileVar, resultVar, indentLevel: indent });
}
