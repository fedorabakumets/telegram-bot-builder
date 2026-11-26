/**
 * @fileoverview Определение компонента inline-запроса через Telethon userbot
 */
import { ComponentDefinition } from "@shared/schema";

/** Ищет у бота и отправляет результат от имени личного аккаунта. */
export const userbotInlineQuery: ComponentDefinition = {
  id: 'userbot-inline-query',
  name: 'Отправить результат поиска',
  description: 'Ищет у бота по фразе и отправляет выбранный результат в чат.',
  icon: 'fas fa-at',
  color: 'bg-violet-100 text-violet-600',
  type: 'userbot_inline_query' as any,
  defaultData: {
    botUsername: '',
    query: '',
    targetChat: '',
    sendToSameChat: true,
    resultIndex: '0',
    saveResultTitleTo: '',
    saveResultDescTo: '',
    saveResponseIdTo: '',
    autoTransitionTo: '',
  }
};
