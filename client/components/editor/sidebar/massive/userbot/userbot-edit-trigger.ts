/**
 * @fileoverview Определение компонента триггера редактирования через Telethon userbot
 */
import { ComponentDefinition } from "@shared/schema";

/** Триггер редактирования сообщения через юзербот (Telethon) */
export const userbotEditTrigger: ComponentDefinition = {
  id: 'userbot-edit-trigger',
  name: 'Редактирование (юзербот)',
  description: 'Срабатывает при редактировании сообщения в чате',
  icon: 'fas fa-pen',
  color: 'bg-amber-100 text-amber-600',
  type: 'userbot_edit_trigger' as any,
  defaultData: {
    userbotEntity: '',
    filterType: 'any',
    filterValue: '',
    saveTextTo: 'edit_text',
    saveMessageIdTo: 'edit_msg_id',
    saveChatIdTo: '',
    saveSenderIdTo: '',
    autoTransitionTo: '',
  }
};
