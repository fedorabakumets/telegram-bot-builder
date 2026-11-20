/** @fileoverview Проверяемый формат переноса пользователей без секретов ботов. */
import { z } from 'zod';
/** Отдельные поля, доступные для независимого выбора при экспорте. */
export const USER_TRANSFER_FIELDS = [
  { id: 'firstName', label: 'Имя' },
  { id: 'lastName', label: 'Фамилия' },
  { id: 'userName', label: 'Username' },
  { id: 'languageCode', label: 'Язык Telegram' },
  { id: 'isPremium', label: 'Telegram Premium' },
  { id: 'acquisitionSource', label: 'Источник' },
  { id: 'deepLinkParam', label: 'Параметр ссылки /start' },
  { id: 'referrerId', label: 'ID пригласившего' },
  { id: 'variables', label: 'Переменные' },
  { id: 'incomingMessageCount', label: 'Сообщения' },
  { id: 'buttonClickCount', label: 'Нажатия кнопок' },
  { id: 'registeredAt', label: 'Дата первого обращения' },
  { id: 'lastInteraction', label: 'Дата последней активности' },
  { id: 'lastMessageAt', label: 'Дата последнего сообщения' },
  { id: 'status', label: 'Статус пользователя' },
  { id: 'isActive', label: 'Признак активности' },
  { id: 'isBlocked', label: 'Пользователь заблокировал бота' },
  { id: 'isDeleted', label: 'Аккаунт удалён' },
] as const;
/** Старые названия групп поддерживаются для импорта ранее скачанных файлов. */
const transferFieldIds = ['profile', 'sources', 'metrics', 'statuses', 'dates', ...USER_TRANSFER_FIELDS.map(field => field.id)] as const;
/** Отдельное поле либо группа из старого формата. */
export type UserTransferField = typeof transferFieldIds[number];
/** Проверяет вложенные значения и исключает опасные ключи при последующем объединении объектов. */
function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 20) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(item => safeJson(item, depth + 1));
  return typeof value === 'object' && Object.entries(value).every(([key, item]) =>
    !['__proto__', 'constructor', 'prototype'].includes(key) && safeJson(item, depth + 1));
}
/** Допустимые переменные сохраняют исходные типы, но не исполняемый код и прототипы. */
const variables = z.custom<Record<string, unknown>>(value => value !== null && typeof value === 'object'
  && !Array.isArray(value) && safeJson(value), 'Некорректные переменные').pipe(z.record(z.string().max(200), z.unknown()));
/** Короткое необязательное текстовое значение. */
const text = z.string().max(2000).nullable().optional();
/** Статусы из старых выгрузок могут быть булевыми либо числовыми. */
const flag = z.union([z.boolean(), z.literal(0), z.literal(1)]).nullable().optional();
/** Общие переносимые поля профиля и отдельной связи с ботом. */
const details = {
  firstName: text, lastName: text, userName: text, languageCode: text, isPremium: flag,
  acquisitionSource: text, deepLinkParam: text, referrerId: text, userData: variables.optional(),
  incomingMessageCount: z.number().int().nonnegative().optional(), buttonClickCount: z.number().int().nonnegative().optional(),
  isActive: flag, isBlocked: flag, isDeleted: flag, status: text,
  registeredAt: text, lastInteraction: text, lastMessageAt: text,
};
/** Связь с ботом никогда не содержит его секретный токен. */
export const userTransferMembershipSchema = z.object({
  tokenId: z.number().int().positive(), name: text, username: text, ...details,
});
/** Пользователь сохраняет Telegram ID строкой, независимо от табличных редакторов. */
export const userTransferUserSchema = z.object({
  userId: z.string().regex(/^\d{1,20}$/, 'Некорректный Telegram ID'),
  tokenId: z.number().int().positive().nullable().optional(), ...details,
  memberships: z.array(userTransferMembershipSchema).max(1000).optional(),
});
/** Один переносимый пользователь. */
export type UserTransferUser = z.infer<typeof userTransferUserSchema>;
/** Документ с явной версией формата. */
export const userTransferDocumentSchema = z.object({
  format: z.literal('botcraft-users'), version: z.literal(1), exportedAt: z.string().max(100),
  fields: z.array(z.enum(transferFieldIds)).max(transferFieldIds.length),
  users: z.array(userTransferUserSchema).max(100000),
});
/** Проверенный документ переноса. */
export type UserTransferDocument = z.infer<typeof userTransferDocumentSchema>;
/** Читает JSON с поддержкой BOM и ограничением размера до разбора. */
export function parseUserTransfer(text: string): UserTransferDocument {
  if (new TextEncoder().encode(text).length > 10 * 1024 * 1024) throw new Error('Файл превышает 10 МБ');
  return userTransferDocumentSchema.parse(JSON.parse(text.replace(/^\uFEFF/, '')));
}
export { createUserTransfer, serializeUserTransfer } from './user-transfer-codec';
