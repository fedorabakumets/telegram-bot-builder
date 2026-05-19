/**
 * @fileoverview Zod-схема для валидации параметров шаблона set-variable
 * @module templates/set-variable/set-variable.schema
 */

import { z } from 'zod';

/** Схема одного присваивания переменной */
const setVariableAssignmentSchema = z.object({
  /** Уникальный идентификатор присваивания */
  id: z.string(),
  /** Имя переменной для записи */
  variable: z.string(),
  /** Значение или шаблон с {переменными} */
  value: z.string(),
  /** Режим: "text" — шаблон, "expression" — выражение, "lookup" — поиск, "str_replace" — замена подстроки, "json_push" — добавить объект в массив, "json_format" — форматировать массив в строку, "random" — случайное число, "random_item" — случайный элемент из списка, "array_item" — элемент массива/объекта по индексу/ключу, "timestamp" — временная метка, "format_duration" — форматирование секунд в MM:SS */
  mode: z.enum(['text', 'expression', 'lookup', 'str_replace', 'json_push', 'json_format', 'random', 'random_item', 'array_item', 'timestamp', 'format_duration']),
  /** Имя таблицы для поиска (только для mode=lookup) */
  lookupTable: z.string().optional().default(''),
  /** Поле таблицы, значение которого сохранить (только для mode=lookup) */
  lookupField: z.string().optional().default(''),
  /** Условия поиска: массив [{field, value}] (только для mode=lookup) */
  lookupWhere: z.array(z.object({
    /** Поле таблицы для сравнения */
    field: z.string(),
    /** Значение для сравнения (поддерживает {переменные}) */
    value: z.string(),
  })).optional().default([]),
  /** На что заменить (только для mode=str_replace, поддерживает {переменные}) */
  replaceWith: z.string().optional().default(''),
  /** Максимальное значение для mode=random */
  maxValue: z.string().optional().default(''),
  /** Условие пропуска: имя переменной — если пустая/0, assignment не выполняется */
  skipIfEmpty: z.string().optional().default(''),
});

/** Схема для валидации параметров узла set_variable */
export const setVariableParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Список присваиваний переменных */
  assignments: z.array(setVariableAssignmentSchema),
  /** ID следующего узла для автоперехода */
  autoTransitionTo: z.string(),
});

export type SetVariableParams = z.infer<typeof setVariableParamsSchema>;
