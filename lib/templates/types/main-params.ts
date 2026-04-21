/**
 * @fileoverview Параметры для шаблона запуска бота (main.py.jinja2)
 * @module templates/types/main-params
 */

/** Параметры для генерации функции запуска бота */
export interface MainTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** Список команд меню для BotFather [{command, description}] */
  menuCommands?: Array<{ command: string; description: string }>;
  /** Есть ли inline кнопки (для callback middleware) */
  hasInlineButtons?: boolean;
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
