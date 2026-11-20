/** @fileoverview Фиксированная аудитория из результатов поиска без расширения до всех пользователей. */
import type { NewBroadcastFormData } from '../types';

/** Открытые реквизиты выбранного человека для проверки аудитории. */
export interface FixedAudienceUser {
  /** Telegram ID. */ userId: string;
  /** Сохранённое имя. */ firstName?: string | null;
  /** Сохранённая фамилия. */ lastName?: string | null;
  /** Сохранённый username. */ userName?: string | null;
}

/** Получатели, зафиксированные при открытии редактора. */
export interface FixedBroadcastAudience {
  /** Бот, которому принадлежат найденные диалоги. */
  tokenId: number;
  /** Полный список уникальных Telegram ID. */
  userIds: readonly string[];
  /** Источник списка: найденные либо выбранные пользователи. */
  label: string;
  /** Имена и реквизиты для просмотра списка, не передаваемые в Telegram. */
  users?: readonly FixedAudienceUser[];
}

/**
 * Сохраняет бот и список получателей при изменении текста, кнопок и шагов редактора.
 * @param form - Текущее содержимое формы
 * @param audience - Неизменяемая аудитория
 * @returns Форма ручной рассылки только указанным людям
 */
export function applyFixedAudience(form: NewBroadcastFormData, audience: FixedBroadcastAudience): NewBroadcastFormData {
  return { ...form, fixedAudience: audience, tokenIds: [audience.tokenId], groupsByTokenId: {}, retryAudience: undefined,
    filters: { audienceType: 'manual', userIds: [...audience.userIds] } };
}

/**
 * Запрещает отправку при потере или расширении зафиксированного списка.
 * @param form - Форма перед внешней отправкой
 * @returns Ничего для корректной аудитории
 */
export function validateFixedAudience(form: NewBroadcastFormData): void {
  const audience = form.fixedAudience;
  if (!audience) return;
  const ids = form.filters.userIds ?? [];
  if (!audience.userIds.length || audience.userIds.length > 10000 || !Number.isSafeInteger(audience.tokenId)
    || audience.tokenId < 1 || audience.userIds.some(id => !/^[1-9]\d{0,19}$/.test(id))
    || form.tokenIds.length !== 1 || form.tokenIds[0] !== audience.tokenId
    || form.filters.audienceType !== 'manual' || ids.length !== audience.userIds.length
    || ids.some((id, index) => id !== audience.userIds[index])
    || Object.values(form.groupsByTokenId ?? {}).some(groups => groups.length > 0)) {
    throw new Error('Список получателей изменился. Закройте редактор и выберите пользователей заново.');
  }
}
