/**
 * @fileoverview Определение узла получения токена управляемого бота
 * @module components/editor/sidebar/massive/managed-bots/get-managed-bot-token-node
 */
import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла получения токена управляемого бота.
 * Вызывает getManagedBotToken(user_id) через Bot API 9.6
 * и сохраняет токен в переменную.
 */
export const getManagedBotTokenNode: ComponentDefinition = {
  id: 'get-managed-bot-token',
  name: 'Получить токен бота',
  description: 'Получить токен управляемого бота через getManagedBotToken',
  icon: 'fas fa-key',
  color: 'bg-indigo-100 text-indigo-600',
  type: 'get_managed_bot_token' as any,
  defaultData: {
    /** Источник bot_id: 'variable' или 'manual' */
    botIdSource: 'variable',
    /** Имя переменной с bot_id */
    botIdVariable: 'bot_id',
    /** Ручной ввод числового ID бота */
    botIdManual: '',
    /** Переменная для сохранения токена */
    saveTokenTo: 'bot_token',
    /** Переменная для сохранения ошибки (опционально) */
    saveErrorTo: '',
    /** Следующий узел */
    autoTransitionTo: '',
  },
};
