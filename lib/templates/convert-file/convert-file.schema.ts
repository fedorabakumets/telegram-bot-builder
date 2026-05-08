/**
 * @fileoverview Zod-схема для валидации параметров шаблона convert-file
 * @module templates/convert-file/convert-file.schema
 */
import { z } from 'zod';

/** Схема для валидации параметров узла convert_file */
export const convertFileParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Имя входной переменной с json-массивом */
  inputVariable: z.string(),
  /** Формат выходного файла */
  format: z.enum(['csv', 'json']),
  /** Имя выходного файла, поддерживает {date} */
  fileName: z.string(),
  /** Разделитель для CSV */
  csvDelimiter: z.string(),
  /** Включать заголовки в CSV */
  includeHeaderRow: z.boolean(),
  /** Имя переменной для сохранения file-объекта */
  outputVariable: z.string(),
  /** ID следующего узла для автоперехода */
  autoTransitionTo: z.string(),
});

/** Тип параметров, выведенный из схемы */
export type ConvertFileParams = z.infer<typeof convertFileParamsSchema>;
