/**
 * @fileoverview Определение компонента назначения администратором
 * Дать права администратора
 */
import { ComponentDefinition } from "@shared/schema";

/** Назначение пользователя администратором */
export const promoteUser: ComponentDefinition = {
  id: 'promote-user',
  name: 'Назначить администратором',
  description: 'Дать права администратора',
  icon: 'fas fa-crown',
  color: 'bg-yellow-100 text-yellow-600',
  type: 'promote_user',
  defaultData: {
    targetUserId: '',
    userIdSource: 'last_message',
    userVariableName: '',
    canChangeInfo: false,
    canDeleteMessages: true,
    canBanUsers: false,
    canInviteUsers: true,
    canPinMessages: true,
    canAddAdmins: false,
    canRestrictMembers: false,
    canPromoteMembers: false,
    canManageVideoChats: false,
    canManageTopics: false,
    isAnonymous: false
  }
};
