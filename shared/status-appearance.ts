/** @fileoverview Единые цвета статусов пользователей, ботов и проверок для всех частей интерфейса. */
/** Подписи объединены по смыслу; неизвестный статус остаётся нейтральным. */
const tones = {
  success: ['Активен', 'Активные', 'Онлайн', 'Проверка пройдена'],
  danger: ['Заморожен', 'Заморожены Telegram', 'Бот заморожен Telegram', 'Заблокирован', 'Бот заблокирован Telegram',
    'Другие блокировки Telegram', 'Бот заблокирован или деактивирован Telegram', 'Бот недоступен для пользователей',
    'Нет доступных ботов у пользователя', 'Нет доступных ботов в Telegram'],
  deleted: ['Аккаунт удалён', 'Ошибка токена', 'Недействительный токен', 'Telegram отклонил токен'],
  warning: ['Не удалось проверить',
    'Недоступен', 'Бот недоступен в Telegram', 'Боты недоступны в Telegram',
    'Пользователь заблокировал бота', 'Бот исключён', 'Не удалось проверить чат'],
};
/** Общая палитра вместо независимых цветов в каждом компоненте. */
const palette = { success: '#10b981', danger: '#ef4444', warning: '#d4a951', deleted: '#a78bfa' };
/** Возвращает цвет текста и спокойную подложку статуса. @param label - Полная либо короткая подпись. @returns Оформление или нейтральный цвет. */
export function statusAppearance(label: string | null | undefined): { /** Цвет текста. */ color: string; /** Полупрозрачная подложка. */ backgroundColor?: string } {
  const tone = (Object.keys(tones) as Array<keyof typeof tones>).find(key => tones[key].includes(label ?? ''));
  const color = tone ? palette[tone] : 'var(--muted-foreground)';
  return { color, ...(tone ? { backgroundColor: `${color}1f` } : {}) };
}
