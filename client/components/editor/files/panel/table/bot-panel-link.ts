/** @fileoverview Адрес карточки конкретного бота внутри конструктора с сохранением листа. */
/**
 * Формирует переход в настройки бота без параметров чужого диалога или сообщения.
 * @param projectId - Проект владельца файла
 * @param tokenId - Идентификатор бота
 * @param search - Текущие параметры страницы
 * @returns Адрес вкладки с якорем карточки
 */
export function buildBotPanelHref(projectId: number, tokenId: number, search: string): string {
  const params = new URLSearchParams({ tab: 'bot', bot: String(tokenId) });
  const sheet = new URLSearchParams(search).get('sheet');
  if (sheet) params.set('sheet', sheet);
  return `/projects/${projectId}?${params}#bot-${projectId}-${tokenId}`;
}
