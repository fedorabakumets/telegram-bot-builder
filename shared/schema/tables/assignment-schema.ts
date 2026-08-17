/**
 * @fileoverview Zod-схема присваивания переменной (set_variable)
 * @module shared/schema/tables/assignment-schema
 */

import { z } from "zod";

/** Режимы присваивания, совпадающие с редактором и шаблоном set-variable */
export const ASSIGNMENT_MODES = [
  'text',
  'expression',
  'lookup',
  'str_replace',
  'json_push',
  'json_format',
  'random',
  'random_item',
  'array_item',
  'timestamp',
  'format_duration',
  'format_number',
  'regex_extract',
  'extract_number',
  'split_get',
  'json_get',
  'substring',
  'conditional',
  'lowercase',
  'uppercase',
  'trim',
  'length',
  'array_concat',
] as const;

/** Схема одного присваивания переменной */
export const assignmentSchema = z.object({
  /** Уникальный идентификатор присваивания */
  id: z.string(),
  /** Имя переменной для записи */
  variable: z.string(),
  /** Значение или шаблон с {переменными} */
  value: z.string(),
  /** Режим присваивания */
  mode: z.enum(ASSIGNMENT_MODES).default('text'),
  /** Имя таблицы для поиска (mode=lookup) */
  lookupTable: z.string().optional().default(''),
  /** Поле таблицы, значение которого сохранить (lookup / json_format) */
  lookupField: z.string().optional().default(''),
  /** Условия поиска [{field, value}] (mode=lookup) */
  lookupWhere: z.array(z.object({
    /** Поле таблицы для сравнения */
    field: z.string(),
    /** Значение для сравнения (поддерживает {переменные}) */
    value: z.string(),
  })).optional().default([]),
  /** На что заменить (mode=str_replace) */
  replaceWith: z.string().optional().default(''),
  /** Регулярное выражение (mode=regex_extract) */
  pattern: z.string().optional().default(''),
  /** Номер группы захвата (mode=regex_extract) */
  regexGroup: z.string().optional().default('0'),
  /** Максимум для random или индекс array_item */
  maxValue: z.string().optional().default(''),
  /** Разделитель для split_get */
  separator: z.string().optional().default(''),
  /** Путь для json_get (dot notation) */
  jsonPath: z.string().optional().default(''),
  /** Начальный индекс для substring */
  startIndex: z.string().optional().default('0'),
  /** Конечный индекс для substring */
  endIndex: z.string().optional().default(''),
  /** Переменная для проверки (conditional) */
  conditionVariable: z.string().optional().default(''),
  /** Оператор сравнения (conditional) */
  conditionOperator: z.string().optional().default('equals'),
  /** Значение для сравнения (conditional) */
  conditionValue: z.string().optional().default(''),
  /** Значение если true (conditional) */
  trueValue: z.string().optional().default(''),
  /** Значение если false (conditional) */
  falseValue: z.string().optional().default(''),
  /** Имя второго массива для объединения (array_concat) */
  concatWith: z.string().optional().default(''),
  /** Пропустить присваивание, если эта переменная пустая или 0 */
  skipIfEmpty: z.string().optional().default(''),
});

/** Тип присваивания переменной */
export type Assignment = z.infer<typeof assignmentSchema>;
