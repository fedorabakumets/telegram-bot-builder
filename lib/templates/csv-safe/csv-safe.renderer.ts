import type { CsvSafeTemplateParams } from './csv-safe.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateCsvSafe(params: CsvSafeTemplateParams): string {
  return renderPartialTemplate('csv-safe/csv-safe.py.jinja2', params);
}

export function generateSafeCsvWrite(csvFileVar: string, dataVar: string, indent?: string): string {
  return generateCsvSafe({ operation: 'write', csvFileVar, dataVar, indentLevel: indent });
}

export function generateSafeCsvRead(csvFileVar: string, resultVar: string, indent?: string): string {
  return generateCsvSafe({ operation: 'read', csvFileVar, resultVar, indentLevel: indent });
}
