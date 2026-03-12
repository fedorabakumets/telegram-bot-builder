/**
 * @fileoverview Определение компонента заглушения пользователя
 * Ограничить права участника
 */
import { ComponentDefinition } from "@shared/schema";

/** Заглушение пользователя (ограничение прав) */
export const muteUser: ComponentDefinition = {
  id: 'mute-user',
  name: 'Заглушить пользователя',
  description: 'Ограничить права участника',
  icon: 'fas fa-volume-mute',
  color: 'bg-orange-100 text-orange-600',
  type: 'mute_user',
  defaultData: {
    command: '/mute_user',
    targetUserId: '',
    userIdSource: 'last_message',
    userVariableName: '',
    duration: 3600,
    reason: 'Нарушение правил группы',
    canSendMessages: false,
    canSendMediaMessages: false,
    canSendPolls: false,
    canSendOtherMessages: false,
    canAddWebPagePreviews: false,
    canChangeGroupInfo: false,
    canInviteUsers2: false,
    canPinMessages2: false
  }
};
