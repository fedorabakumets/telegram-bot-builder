/**
 * @fileoverview Оформление бейджа статуса большой рассылки
 * @module editor/database/dialog/utils/campaign-status-badge
 */

/**
 * Описание бейджа статуса
 */
export interface StatusBadge {
  /** CSS-классы бейджа */
  className: string;
  /** Подпись статуса */
  label: string;
}

/**
 * Возвращает цвет и текст бейджа по статусу большой рассылки
 * @param status - Статус рассылки
 * @returns Классы и подпись бейджа
 */
export function getCampaignStatusBadge(status: string): StatusBadge {
  switch (status) {
    case 'done':
      return { className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', label: 'Завершена' };
    case 'running':
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', label: 'Отправка...' };
    case 'stopped':
      return { className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', label: 'Остановлена' };
    case 'partial':
      return { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', label: 'Частично' };
    case 'failed':
      return { className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', label: 'Ошибка' };
    case 'pending':
      return { className: 'bg-muted text-muted-foreground', label: 'В очереди' };
    default:
      return { className: 'bg-muted text-muted-foreground', label: status };
  }
}

/**
 * Форматирует дату рассылки для ленты
 * @param date - Дата создания
 * @returns Строка с датой и временем
 */
export function formatBroadcastDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
