/**
 * @fileoverview Определение компонента inline-запроса через Telethon userbot
 */
import { ComponentDefinition } from "@shared/schema";

/** Inline-запрос через юзербот (Telethon) */
export const userbotInlineQuery: ComponentDefinition = {
  id: 'userbot-inline-query',
  name: 'Inline-запрос (юзербот)',
  description: 'Inline-запрос к боту и отправка результата через Telethon',
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
