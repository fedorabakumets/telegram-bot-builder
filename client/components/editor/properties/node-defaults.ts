/**
 * @fileoverview Данные по умолчанию для узлов бота
 * Для инициализации новых узлов в Telegram Bot Builder.
 * @module node-defaults
 */

import { Node } from '@shared/schema';

/**
 * Получает данные по умолчанию для типа узла.
 * @param {Node['type']} type - Тип узла
 * @returns {any} Объект с данными по умолчанию
 */
export function getNodeDefaults(type: Node['type']): any {
  const defaults: Record<Node['type'], any> = {
    message: {},
    sticker: { stickerUrl: '', stickerFileId: '' },
    voice: { voiceUrl: '', duration: 0 },
    animation: { animationUrl: '', duration: 0, width: 0, height: 0, mediaCaption: '' },
    location: { latitude: 55.7558, longitude: 37.6176, title: 'Москва', address: 'Москва, Россия', foursquareId: '', foursquareType: '' },
    contact: { phoneNumber: '+7 (999) 123-45-67', firstName: 'Имя', lastName: 'Фамилия', userId: 0, vcard: '' },
    start: { command: '/start', description: 'Запустить бота', showInMenu: true, isPrivateOnly: false, requiresAuth: false, adminOnly: false, synonyms: [] },
    command: { command: '/custom', description: 'Новая команда', showInMenu: true, isPrivateOnly: false, requiresAuth: false, adminOnly: false, synonyms: [] },
    pin_message: { command: '/pin_message', synonyms: ['закрепить', 'прикрепить', 'зафиксировать'], disableNotification: false },
    unpin_message: { command: '/unpin_message', synonyms: ['открепить', 'отцепить', 'убрать закрепление'] },
    delete_message: { command: '/delete_message', synonyms: ['удалить', 'стереть', 'убрать сообщение'] },
    ban_user: { command: '/ban_user', synonyms: ['забанить', 'заблокировать', 'бан'], reason: 'Нарушение правил группы', untilDate: 0 },
    unban_user: { command: '/unban_user', synonyms: ['разбанить', 'разблокировать', 'unbан'] },
    mute_user: { command: '/mute_user', synonyms: ['замутить', 'заглушить', 'мут'], reason: 'Нарушение правил группы', duration: 3600, canSendMessages: false, canSendMediaMessages: false, canSendPolls: false, canSendOtherMessages: false, canAddWebPagePreviews: false, canChangeGroupInfo: false, canInviteUsers2: false, canPinMessages2: false },
    unmute_user: { command: '/unmute_user', synonyms: ['размутить', 'разглушить', 'анмут'] },
    kick_user: { command: '/kick_user', synonyms: ['кикнуть', 'исключить', 'выгнать'], reason: 'Нарушение правил группы' },
    promote_user: { command: '/promote_user', synonyms: ['повысить', 'назначить админом', 'промоут'], canChangeInfo: false, canDeleteMessages: true, canBanUsers: false, canInviteUsers: true, canPinMessages: true, canAddAdmins: false, canRestrictMembers: false, canPromoteMembers: false, canManageVideoChats: false, canManageTopics: false, isAnonymous: false },
    demote_user: { command: '/demote_user', synonyms: ['понизить', 'снять с админки', 'демоут'] },
    admin_rights: {
      command: '/admin_rights', description: 'Управление правами администратора', synonyms: ['права админа', 'изменить права', 'админ права', 'тг права', 'права'],
      adminUserIdSource: 'last_message', adminChatIdSource: 'current_chat', keyboardType: 'inline',
      buttons: [
        { id: 'perm_change_info', text: '🏷️ Изменение профиля', action: 'command', target: 'toggle_change_info', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_delete_messages', text: '🗑️ Удаление сообщений', action: 'command', target: 'toggle_delete_messages', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_restrict_members', text: '🚫 Блокировка участников', action: 'command', target: 'toggle_restrict_members', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_invite_users', text: '📨 Приглашение участников', action: 'command', target: 'toggle_invite_users', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_pin_messages', text: '📌 Закрепление сообщений', action: 'command', target: 'toggle_pin_messages', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_manage_video_chats', text: '🎥 Управление видеочатами', action: 'command', target: 'toggle_manage_video_chats', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_anonymous', text: '🔒 Анонимность', action: 'command', target: 'toggle_anonymous', buttonType: 'option', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_promote_members', text: '👑 Назначение администраторов', action: 'command', target: 'toggle_promote_members', buttonType: 'option', skipDataCollection: false, hideAfterClick: false }
      ],
      can_manage_chat: false, can_post_messages: false, can_edit_messages: false, can_delete_messages: true, can_post_stories: false, can_edit_stories: false, can_delete_stories: false, can_manage_video_chats: false, can_restrict_members: false, can_promote_members: false, can_change_info: false, can_invite_users: true, can_pin_messages: true, can_manage_topics: false, is_anonymous: false
    }
  };
  return defaults[type] || {};
}
