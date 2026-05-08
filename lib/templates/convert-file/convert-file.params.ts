/**
 * @fileoverview Параметры шаблона convert-file
 * @module templates/convert-file/convert-file.params
 */

/** Параметры для генерации кода узла convert_file */
export interface ConvertFileTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Имя входной переменной с json-массивом */
  inputVariable: string;
  /** Формат выходного файла: csv | json */
  format: 'csv' | 'json';
  /** Имя выходного файла, поддерживает {date} */
  fileName: string;
  /** Разделитель для CSV */
  csvDelimiter: string;
  /** Включать заголовки в CSV */
  includeHeaderRow: boolean;
  /** Имя переменной для сохранения file-объекта */
  outputVariable: string;
  /** ID следующего узла для автоперехода */
  autoTransitionTo: string;
}
