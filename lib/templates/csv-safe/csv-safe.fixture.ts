/**
 * @fileoverview Тестовые данные для шаблона csv-safe
 * @module templates/csv-safe/csv-safe.fixture
 */

import type { CsvSafeTemplateParams } from './csv-safe.params';

/** Валидные параметры: запись в CSV */
export const validParamsWrite: CsvSafeTemplateParams = {
  operation: 'write',
  csvFileVar: 'csv_file_path',
  dataVar: 'user_id',
};

/** Валидные параметры: чтение из CSV */
export const validParamsRead: CsvSafeTemplateParams = {
  operation: 'read',
  csvFileVar: 'csv_file_path',
  resultVar: 'csv_data',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: CsvSafeTemplateParams = {
  operation: 'write',
  csvFileVar: 'my_csv',
  dataVar: 'record',
  indentLevel: '    ',
};
