/** @fileoverview Проверка аудитории перед повторной отправкой рассылки. */
import type { NewBroadcastFormData } from '../types';

/**
 * Запрещает повторную отправку без явно загруженных получателей одного бота.
 * @param form - Данные мастера рассылки
 * @returns Ничего; при некорректной аудитории выбрасывает ошибку
 */
export function validateRetryAudience(form: NewBroadcastFormData): void {
  if (form.filters.audienceType !== 'retry') return;
  const ids = form.filters.userIds ?? [];
  if (form.tokenIds?.length !== 1 || !Number.isSafeInteger(form.filters.retryBroadcastId) ||
      (form.filters.retryBroadcastId ?? 0) <= 0 || ids.length === 0 || ids.length > 10000 ||
      ids.some((id) => !/^\d+$/.test(id))) {
    throw new Error('Выберите одного бота и загрузите получателей с ошибками прошлой рассылки.');
  }
}
