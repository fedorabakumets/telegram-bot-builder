/** @fileoverview Запасной источник контакта без подтверждённой атрибуции аналитики. */
/** Подпись отсутствующего сохранённого источника. */
export const UNSAVED_USER_SOURCE = 'Источник не сохранён';
/**
 * Показывает сохранённую ссылку либо пригласившего, не считая direct рекламной меткой.
 * @param link - Сохранённый параметр запуска.
 * @param referrer - Идентификатор пригласившего.
 * @returns Понятная подпись источника.
 */
export function userSourceFallback(link?: string | null, referrer?: string | number | null): string {
  if (link?.trim() && link.trim() !== 'direct') return `Ссылка · ${link.trim()}`;
  if (referrer != null && String(referrer).trim()) return `Приглашение · ${String(referrer).trim()}`;
  return UNSAVED_USER_SOURCE;
}
