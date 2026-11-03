/** @fileoverview Адаптер настроек и ENV с маскированием всех значений и подтверждением записи. */
import { userDataRequest } from './user-data-db';
/** Удаляет секреты из произвольного ответа настроек. */
export function redactBotSettings(value: unknown): any {
  if (Array.isArray(value)) return value.map(redactBotSettings);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/^(value|token|webhookSecretToken|userbotApiHash|userbotSessionString)$/i.test(key)).map(([key, item]) => [key, redactBotSettings(item)]));
}
/** Читает безопасный DTO настроек выбранного бота. */
export async function getBotSettings(projectId: number, tokenId: number) { return redactBotSettings(await userDataRequest(`/api/projects/${projectId}/tokens/${tokenId}/settings`)); }
/** Сохраняет настройку, затем читает подтверждённый DTO. */
export async function setBotSettings(projectId: number, tokenId: number, change: Record<string, unknown>) {
  const { setting, ...body } = change;
  const saved = await userDataRequest(`/api/projects/${projectId}/tokens/${tokenId}/${setting}`, 'PUT', body);
  if (saved.error) return saved;
  if (body.webhookSecretToken !== undefined && saved.persistence?.confirmed !== true) return { error: 'Запись секрета не подтверждена сервером' };
  const stored = await getBotSettings(projectId, tokenId);
  if (stored.error) return { error: 'Запись отправлена, но повторное чтение не подтвердило результат' };
  for (const [key, value] of Object.entries(body)) {
    if (key === 'webhookSecretToken') continue;
    if (stored[key] !== value) return { error: `Запись не подтверждена: ${key}` };
  }
  return { status: 'saved', persistence: { confirmed: true, method: 'readback' }, settings: stored, runtime: 'Для применения части настроек нужен перезапуск; автоматически не выполнялся' };
}
/** Выполняет фиксированный CRUD ENV, скрывая значения даже несекретных ключей. */
export async function botEnvRequest(projectId: number, tokenId: number, method = 'GET', variableId?: number, body?: unknown) {
  const path = `/api/projects/${projectId}/tokens/${tokenId}/env-variables${variableId === undefined ? '' : `/${variableId}`}`;
  const value = await userDataRequest(path, method, body);
  return redactBotSettings(value);
}
/** Сохраняет публичное поле профиля и перечитывает настройки. */
export async function setBotProfile(projectId: number, tokenId: number, body: unknown) {
  const value = await userDataRequest(`/api/projects/${projectId}/tokens/${tokenId}/bot-info`, 'PUT', body);
  if (value.error) return value;
  const stored = await getBotSettings(projectId, tokenId);
  const fields: Record<string, string> = { name: 'botFirstName', description: 'botDescription', shortDescription: 'botShortDescription' };
  const input = body as { field: string; value: string };
  if (stored.error || stored[fields[input.field]] !== input.value) return { error: 'Сохранение профиля не подтверждено повторным чтением' };
  return { status: 'saved', persistence: { confirmed: true, method: 'readback' }, settings: stored };
}
