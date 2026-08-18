/**
 * @fileoverview Список того, что пропадёт при удалении бота из проекта.
 * @module bot/delete-bot-impact
 */

/** Строка последствий удаления */
export interface DeleteBotImpactItem {
  /** Что затронется */
  label: string;
}

/**
 * Собирает пункты подтверждения удаления бота.
 * @param opts - Запущен ли процесс и число пользователей
 * @returns Список для диалога
 */
export function listDeleteBotImpact(opts: {
  isRunning: boolean;
  userCount?: number;
}): DeleteBotImpactItem[] {
  const items: DeleteBotImpactItem[] = [{ label: 'Токен и карточка бота' }];
  if (opts.isRunning) items.push({ label: 'Запущенный процесс' });
  items.push(
    { label: 'Диалоги и переписка этого бота' },
    { label: 'Аналитика этого бота' },
    { label: 'История запусков и логи' },
    { label: 'Переменные окружения' },
    { label: 'Группы этого бота' },
    { label: 'Привязки file_id в Telegram' },
  );
  const users = opts.userCount;
  if (typeof users === 'number' && users > 0) {
    items.push({
      label: `Пользователи этого бота · ${users.toLocaleString('ru-RU')}`,
    });
  }
  return items;
}
