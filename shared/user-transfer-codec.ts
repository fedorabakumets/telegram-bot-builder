/** @fileoverview Проекция выбранных полей и выгрузка пользователей в JSON либо безопасный CSV. */
import { userTransferDocumentSchema, type UserTransferDocument, type UserTransferField } from './user-transfer';
/** Поля каждой группы; технические секреты отсутствуют в белом списке. */
const GROUPS: Partial<Record<UserTransferField, string[]>> = {
  profile: ['firstName', 'lastName', 'userName', 'languageCode', 'isPremium'],
  sources: ['acquisitionSource', 'deepLinkParam', 'referrerId'],
  variables: ['userData'], metrics: ['incomingMessageCount', 'buttonClickCount'],
  statuses: ['isActive', 'isBlocked', 'isDeleted', 'status'],
  dates: ['registeredAt', 'lastInteraction', 'lastMessageAt'],
};
/** Выбирает только отмеченные поля без подстановки отсутствующих значений. */
function project(value: Record<string, unknown>, fields: readonly UserTransferField[]) {
  return Object.fromEntries(fields.flatMap(field => GROUPS[field] ?? [field]).filter(key => value[key] !== undefined)
    .map(key => [key, value[key] instanceof Date ? value[key].toISOString() : value[key]]));
}
/** Собирает документ с отдельными данными каждого бота, исключая токены доступа. */
export function createUserTransfer(users: readonly unknown[], fields: UserTransferField[], tokenId?: number | null): UserTransferDocument {
  return userTransferDocumentSchema.parse({ format: 'botcraft-users', version: 1, exportedAt: new Date().toISOString(), fields,
    users: users.map(raw => { const user = raw as Record<string, unknown>; return ({ userId: String(user.userId), ...(tokenId ? { tokenId } : {}), ...project(user, fields),
      ...(Array.isArray(user.botMemberships) ? { memberships: user.botMemberships.map(member => ({
        tokenId: member.tokenId, name: member.name, username: member.username, ...project(member, fields),
      })) } : {}),
    }); }),
  });
}
/** Нейтрализует формулы табличных редакторов и экранирует разделители CSV. */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\s]*[=+\-@]|^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
/** Выгружает JSON без потерь типов либо CSV с отдельной строкой для каждой связи с ботом. */
export function serializeUserTransfer(doc: UserTransferDocument, format: 'json' | 'csv'): string {
  if (format === 'json') return JSON.stringify(doc, null, 2);
  const columns = ['userId', 'tokenId', 'botName', 'botUsername', ...new Set(doc.fields.flatMap(field => GROUPS[field] ?? [field]))];
  const rows = doc.users.flatMap(user => user.memberships?.length ? user.memberships.map(member => ({
    ...user, ...member, botName: member.name, botUsername: member.username,
  })) : [user]);
  return '\uFEFF' + [columns.map(csvCell).join(','), ...rows.map(row => columns.map(key => csvCell((row as Record<string, unknown>)[key])).join(','))].join('\r\n');
}
