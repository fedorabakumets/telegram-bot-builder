/** @fileoverview Безопасный итог проверки доступности ботов без секретных токенов. */
export interface TelegramBotCheckItem {
  /** Идентификатор бота в проекте. */
  tokenId: number;
  /** Итог проверки Telegram, независимо от запуска бота. */
  status: 'available' | 'unavailable' | 'error';
  /** Безопасная причина неопределённого результата без токена и идентификатора чата. */
  reason?: 'no_test_chat' | 'chat_unavailable' | 'rate_limited' | 'error' | 'timeout' | 'network'
    | 'telegram_error' | 'invalid_response' | 'unauthorized' | 'telegram_frozen' | 'bot_deactivated' | 'token_changed';
  /** Отображаемое имя бота. */
  name?: string;
  /** Публичное имя пользователя бота без секрета. */
  username?: string | null;
  /** Метод Telegram, на котором получен результат. */
  method?: string;
  /** Безопасный числовой код ответа Telegram. */
  errorCode?: number;
  /** Время начала проверки в истории; отсутствует у старых результатов. */
  startedAt?: string | null;
  /** Время получения результата; null означает незавершённую попытку. */
  finishedAt?: string | null;
}
/** Сводка проверки выбранной области. */
export interface TelegramBotCheckResult {
  /** Количество доступных токенов. */
  available: number;
  /** Количество подтверждённо недоступных ботов. */
  unavailable: number;
  /** Количество неопределённых результатов, не меняющих прежний статус. */
  errors: number;
  /** Результаты отдельных ботов без секретов. */
  items: TelegramBotCheckItem[];
}
