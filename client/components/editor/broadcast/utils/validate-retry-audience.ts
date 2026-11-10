/** @fileoverview Проверка проверенной аудитории повторной рассылки пользователей и групп. */
import type { NewBroadcastFormData } from '../types';

/**
 * Запрещает пустую, устаревшую или произвольно расширенную повторную аудиторию.
 * @param form - Данные мастера рассылки
 * @returns Ничего; при некорректной аудитории выбрасывает ошибку
 */
export function validateRetryAudience(form: NewBroadcastFormData): void {
  if (form.filters.audienceType !== 'retry') return;
  const source = form.retryAudience;
  const users = form.filters.userIds ?? [];
  const groups = form.groupsByTokenId ?? {};
  const ids = groups[form.tokenIds?.[0]] ?? [];
  if (!source || form.tokenIds?.length !== 1 || source.tokenId !== form.tokenIds[0] ||
      source.broadcastId !== form.filters.retryBroadcastId || !Number.isSafeInteger(source.broadcastId) ||
      source.broadcastId <= 0 || users.length + ids.length === 0 || users.length + ids.length > 10000 ||
      users.some((id) => !/^[1-9]\d*$/.test(id)) || ids.some((id) => !/^-[1-9]\d*$/.test(id)) ||
      JSON.stringify(users) !== JSON.stringify(source.userIds) ||
      JSON.stringify(ids) !== JSON.stringify(source.groupIds) ||
      Object.keys(groups).some((id) => Number(id) !== source.tokenId) || form.filters.groupIds?.length) {
    throw new Error('Выберите одного бота и загрузите получателей с ошибками прошлой рассылки.');
  }
}

/**
 * Проверяет доступность перехода без выбрасывания исключения.
 * @param form - Данные мастера
 * @returns Готова ли проверенная повторная аудитория
 */
export function isRetryAudienceReady(form: NewBroadcastFormData): boolean {
  try { validateRetryAudience(form); return true; } catch { return false; }
}
