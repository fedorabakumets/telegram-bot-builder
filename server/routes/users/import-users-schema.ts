/** @fileoverview Ограниченный контракт импорта профилей и переменных без служебных состояний Telegram. */
import { z } from 'zod';
/** Проверяет вложенные JSON-значения до обращения к базе. @param value - Значение файла. @param depth - Глубина. @returns Безопасность структуры. */
function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 100_000;
  if (Array.isArray(value)) return value.length <= 1000 && value.every(item => safeJson(item, depth + 1));
  if (typeof value !== 'object') return false;
  const entries = Object.entries(value);
  return entries.length <= 1000 && entries.every(([key, item]) => key.length <= 200
    && !['__proto__', 'constructor', 'prototype'].includes(key) && safeJson(item, depth + 1));
}
/** Необязательное поле профиля; пустые значения не затирают существующие. */
const text = z.string().max(500).nullable().optional();
/** Разрешённые для записи данные; остальные поля экспорта намеренно отбрасываются. */
export const importUserSchema = z.object({
  /** Telegram ID передаётся строкой без потери точности. */
  userId: z.string().regex(/^[1-9]\d{0,15}$/).refine(value => Number.isSafeInteger(Number(value))),
  /** Исходный бот используется только при выборе содержимого файла. */ tokenId: z.number().int().positive().nullable().optional(),
  /** Имя. */ firstName: text,
  /** Фамилия. */ lastName: text,
  /** Публичное имя Telegram. */ userName: text,
  /** Язык Telegram. */ languageCode: z.string().max(30).nullable().optional(),
  /** Первоначальный параметр запуска; не является подтверждённой атрибуцией аналитики. */ deepLinkParam: text,
  /** Идентификатор пригласившего. */ referrerId: text,
  /** Premium — сохранённое свойство профиля, а не проверка Telegram. */ isPremium: z.union([z.boolean(), z.literal(0), z.literal(1)]).nullable().optional(),
  /** Переменные с сохранением существующих значений при совпадении ключей. */
  userData: z.record(z.string(), z.unknown()).refine(value => safeJson(value), 'Недопустимая структура переменных').optional(),
  /** Переменные отдельных исходных ботов никогда не смешиваются автоматически. */
  memberships: z.array(z.object({
    /** ID исходного бота. */ tokenId: z.number().int().positive(),
    /** Параметр запуска именно исходного бота. */ deepLinkParam: text,
    /** Пригласивший именно исходного бота. */ referrerId: text,
    /** Переменные только этого бота. */ userData: z.record(z.string(), z.unknown()).refine(value => safeJson(value)).optional(),
  })).max(1000).optional(),
});
/** Запрос всегда задаёт одного целевого бота текущего проекта. */
export const importUsersBodySchema = z.object({
  /** Целевой бот. */ tokenId: z.number().int().positive(),
  /** Исходный бот для файлов с несколькими наборами переменных. */ sourceTokenId: z.number().int().positive().nullable().optional(),
  /** Режим записи; по умолчанию только предварительный просмотр. */ apply: z.boolean().default(false),
  /** Строки файла, проверяемые полностью до начала транзакции. */ users: z.array(importUserSchema).min(1).max(10_000),
}).strict();
/** Очищенная запись для репозитория импорта. */
export type ImportUser = z.infer<typeof importUserSchema>;
