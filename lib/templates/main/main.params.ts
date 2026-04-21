/**
 * @fileoverview Параметры для шаблона запуска бота
 * @module templates/main/main.params
 */

/** Параметры для генерации функции запуска бота */
export interface MainTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
  /** Список команд меню для BotFather */
  menuCommands?: Array<{ command: string; description: string }>;
  /** Автоматически регистрировать пользователей при первом обращении */
  autoRegisterUsers?: boolean;
  /** Список имён middleware функций для incoming_message_trigger */
  incomingMessageTriggerMiddlewares?: string[];
  /** Список имён middleware функций для managed_bot_updated_trigger */
  managedBotUpdatedTriggerMiddlewares?: string[];
  /** Список имён обработчиков для group_message_trigger */
  groupMessageTriggerHandlers?: string[];
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl?: string | null;
  /** Порт aiohttp сервера для webhook режима */
  webhookPort?: number | null;
  /** ID токена для формирования пути вебхука */
  tokenId?: number | null;
  /** ID проекта для формирования пути вебхука */
  projectId?: number | null;
}
