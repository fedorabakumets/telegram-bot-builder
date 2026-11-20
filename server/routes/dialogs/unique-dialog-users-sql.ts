/** @fileoverview Объединение личных диалогов нескольких ботов в одну строку человека до пагинации. */

/**
 * Выбирает последнюю подходящую переписку человека из уже отфильтрованной выборки.
 * Групповые строки добавляются отдельно после объединения личных диалогов.
 * @param selection - Доверенный SELECT с полями userId, tokenId и lastInteraction
 * @returns SELECT одной строки на пользователя с исходными колонками
 */
export function uniqueDialogUsersSql(selection: string): string {
  return `SELECT * FROM (SELECT DISTINCT ON (matched."userId") matched.* FROM (${selection}) matched
    ORDER BY matched."userId", matched."lastInteraction" DESC NULLS LAST, matched."tokenId") unique_dialogs`;
}
