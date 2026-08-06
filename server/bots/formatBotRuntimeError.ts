/**
 * @fileoverview Человекочитаемые сообщения об ошибках запуска/работы бота
 * @module server/bots/formatBotRuntimeError
 */

/** Правило сопоставления текста ошибки с подсказкой */
interface ErrorHintRule {
  /** Подстрока в сообщении исключения (регистронезависимо) */
  match: string;
  /** Короткий заголовок для UI и логов */
  title: string;
  /** Что делать пользователю */
  hint: string;
}

/** Известные ошибки рантайма бота и подсказки */
const ERROR_HINTS: ErrorHintRule[] = [
  {
    match: 'token is invalid',
    title: 'Неверный токен Telegram-бота',
    hint: 'Откройте @BotFather → ваш бот → API Token, скопируйте токен и вставьте в настройки проекта.',
  },
  {
    match: 'unauthorized',
    title: 'Токен не авторизован',
    hint: 'Токен отозван или неверный. Получите новый в @BotFather и обновите в настройках проекта.',
  },
  {
    match: 'no module named',
    title: 'Не найден модуль Python',
    hint: 'Проверьте зависимости бота или пересоберите код проекта.',
  },
  {
    match: 'syntaxerror',
    title: 'Синтаксическая ошибка в коде бота',
    hint: 'Проверьте схему проекта и пересоберите бот.',
  },
  {
    match: 'indentationerror',
    title: 'Ошибка отступов в коде бота',
    hint: 'Проверьте сгенерированный код или пересоберите проект.',
  },
  {
    match: 'filenotfounderror',
    title: 'Файл бота не найден',
    hint: 'Пересоберите бот или проверьте, что проект сохранён.',
  },
  {
    match: 'connection refused',
    title: 'Не удалось подключиться к сервису',
    hint: 'Проверьте доступность Redis, PostgreSQL или внешних API.',
  },
];

/**
 * Форматирует сырое сообщение ошибки для терминала и истории запусков
 * @param raw - Текст исключения или stderr
 * @returns Многострочное сообщение с заголовком и подсказкой
 */
export function formatBotRuntimeError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'Бот завершился с ошибкой';

  const lower = trimmed.toLowerCase();
  const firstLine = trimmed.split('\n').find((l) => l.trim())?.trim() ?? trimmed;

  for (const rule of ERROR_HINTS) {
    if (lower.includes(rule.match)) {
      return `${rule.title}\n→ ${rule.hint}\n(технически: ${firstLine})`;
    }
  }

  if (trimmed.startsWith('Ошибка бота:')) {
    return trimmed.replace(/^Ошибка бота:\s*/i, 'Ошибка запуска: ');
  }

  return `Ошибка запуска: ${firstLine}`;
}

/**
 * Короткая строка для консоли сервера и errorMessage в БД
 * @param raw - Сырой текст ошибки
 * @returns Однострочное описание
 */
export function formatBotRuntimeErrorShort(raw: string): string {
  const formatted = formatBotRuntimeError(raw);
  const title = formatted.split('\n')[0];
  return title || 'Бот завершился с ошибкой';
}
