/** @fileoverview Проверяемые параметры дополнительных фильтров аудитории. */
import { z } from 'zod';
import { messagePeriodFields, messagePeriodSchema } from './message-period';
/** Дата календаря без времени; границы интерпретируются в Europe/Moscow. */
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Некорректная дата');
/** Неотрицательное целое количество без преобразования пустой строки в ноль. */
const count = z.string().regex(/^\d{1,9}$/);
/** Схема не допускает произвольные SQL-поля и неизвестные параметры. */
export const advancedUserFiltersSchema = z.object({
  ...messagePeriodFields,
  /** Основание контакта, независимо от рекламного источника. */
  contactOrigin: z.enum(['private', 'group_history', 'imported', 'unknown']).optional(),
  /** Прежний период активности для совместимости запросов API. */
  activity: z.enum(['today', '7d', '30d', 'older30']).optional(),
  /** Первый день последней активности включительно. */
  lastActiveFrom: date.optional(),
  /** Последний день последней активности включительно. */
  lastActiveTo: date.optional(),
  /** Первый день регистрации включительно. */
  registeredFrom: date.optional(),
  /** Последний день регистрации включительно. */
  registeredTo: date.optional(),
  /** Точное имя пользовательской переменной. */
  variableName: z.string().trim().min(1).max(200).optional(),
  /** Проверка заполненности либо точного значения переменной. */
  variableMode: z.enum(['filled', 'empty', 'equals']).optional(),
  /** Значение для точного сравнения. */
  variableValue: z.string().max(2000).optional(),
  /** Нижняя граница входящих сообщений. */
  messagesMin: count.optional(),
  /** Верхняя граница входящих сообщений. */
  messagesMax: count.optional(),
  /** Нижняя граница нажатий. */
  clicksMin: count.optional(),
  /** Верхняя граница нажатий. */
  clicksMax: count.optional(),
  /** Число связанных ботов в режиме всех ботов. */
  bots: z.enum(['one', 'multiple']).optional(),
  /** Язык Telegram, например ru, en или pt-br. */
  language: z.union([z.literal('__unknown__'), z.string().trim().toLowerCase().regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/)]).optional(),
}).strict().superRefine((value, ctx) => {
  if (!messagePeriodSchema.safeParse(value).success)
    ctx.addIssue({ code: 'custom', message: 'Дата «С» должна быть раньше даты «По»' });
  for (const [min, max] of [[value.registeredFrom, value.registeredTo], [value.lastActiveFrom, value.lastActiveTo],
    [value.messagesMin, value.messagesMax], [value.clicksMin, value.clicksMax]]) {
    if (min !== undefined && max !== undefined && (min.includes('-') ? min > max : Number(min) > Number(max)))
      ctx.addIssue({ code: 'custom', message: 'Начало диапазона больше конца' });
  }
  if ((value.variableMode || value.variableValue !== undefined) && !value.variableName)
    ctx.addIssue({ code: 'custom', message: 'Укажите имя переменной' });
  if (value.variableMode === 'equals' && value.variableValue === undefined)
    ctx.addIssue({ code: 'custom', message: 'Выберите значение переменной' });
});
/** Проверенный набор дополнительных ограничений. */
export type AdvancedUserFilters = z.infer<typeof advancedUserFiltersSchema>;
