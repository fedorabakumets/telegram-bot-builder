/**
 * @fileoverview Определение триггера обновления управляемого бота (Bot API 9.6)
 * @module components/editor/sidebar/massive/triggers/managed-bot-updated-trigger
 */

import { ComponentDefinition } from "@shared/schema";

/**
 * Определение компонента триггера создания управляемого бота.
 * Срабатывает на сервисное сообщение managed_bot_created (ContentType.MANAGED_BOT_CREATED).
 */
export const managedBotUpdatedTrigger: ComponentDefinition = {
  id: 'managed-bot-updated-trigger',
  name: 'Триггер создания бота',
  description: 'Срабатывает когда пользователь создал управляемого бота',
  icon: 'fas fa-robot',
  color: 'bg-indigo-100 text-indigo-600',
  type: 'managed_bot_updated_trigger' as any,
  defaultData: {
    /** Переменная для сохранения bot.id */
    saveBotIdTo: 'bot_id',
    /** Переменная для сохранения bot.username */
    saveBotUsernameTo: 'bot_username',
    /** Переменная для сохранения bot.first_name */
    saveBotNameTo: 'bot_name',
    /** Переменная для сохранения user.id создателя */
    saveCreatorIdTo: 'creator_id',
    /** Переменная для сохранения user.username создателя */
    saveCreatorUsernameTo: 'creator_username',
    /** Фильтр по user.id — пусто означает реагировать на всех */
    filterByUserId: '',
    /** ID следующего узла для автоперехода */
    autoTransitionTo: '',
  }
};
