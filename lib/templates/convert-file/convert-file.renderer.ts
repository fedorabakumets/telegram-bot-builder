/**
 * @fileoverview Функции рендеринга шаблона узла convert_file
 * @module templates/convert-file/convert-file.renderer
 */
import type { Node } from '@shared/schema';
import type { ConvertFileTemplateParams } from './convert-file.params';
import { convertFileParamsSchema } from './convert-file.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает параметры шаблона для всех узлов типа convert_file.
 * @param nodes - Массив узлов холста
 * @returns Массив ConvertFileTemplateParams
 */
export function collectConvertFileEntries(nodes: Node[]): ConvertFileTemplateParams[] {
  return nodes
    .filter(n => n != null && (n.type as string) === 'convert_file')
    .map(node => ({
      nodeId: node.id,
      inputVariable: (node.data as any)?.convertFileInputVariable || '',
      format: (node.data as any)?.convertFileFormat || 'csv',
      fileName: (node.data as any)?.convertFileFileName || 'export_{date}.csv',
      csvDelimiter: (node.data as any)?.convertFileCsvDelimiter || ',',
      includeHeaderRow: (node.data as any)?.convertFileIncludeHeaderRow ?? true,
      outputVariable: (node.data as any)?.convertFileOutputVariable || '',
      autoTransitionTo: (node.data as any)?.autoTransitionTo || '',
    }));
}

/**
 * Генерирует Python-код обработчиков для всех узлов convert_file.
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateConvertFileHandlers(nodes: Node[]): string {
  const entries = collectConvertFileEntries(nodes);
  if (entries.length === 0) return '';

  return entries
    .map(params => {
      const validated = convertFileParamsSchema.parse(params);
      return renderPartialTemplate('convert-file/convert-file.py.jinja2', validated);
    })
    .join('\n');
}
