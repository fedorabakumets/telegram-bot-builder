/**
 * @fileoverview Генерация обработчиков для новых типов узлов через шаблоны
 * @module generate/generate-new-node-handlers
 */

import { Node } from '@shared/schema';
import { generateBroadcast as generateBroadcastTemplate } from '../bot-generator/templates/broadcast/broadcast.renderer';
import { generateSticker as generateStickerTemplate } from '../bot-generator/templates/sticker/sticker.renderer';
import { generateVoice as generateVoiceTemplate } from '../bot-generator/templates/voice/voice.renderer';
import { generateAdmin as generateAdminTemplate } from '../bot-generator/templates/admin/admin.renderer';

/**
 * Генерирует обработчик рассылки (broadcast)
 * @param node - Узел рассылки
 * @param _enableCommentss - Включить ли комментарии
 * @returns Сгенерированный Python код
 */
export function generateBroadcastHandler(
  node: Node,
  _enableCommentss: boolean = true
): string {
  const params = {
    nodeId: node.id,
    broadcastApiType: node.data?.broadcastApiType || 'bot',
    broadcastTargetNode: node.data?.broadcastTargetNode || '',
    enableBroadcast: node.data?.enableBroadcast || false,
    enableConfirmation: node.data?.enableConfirmation || false,
    confirmationText: node.data?.confirmationText || '',
    successMessage: node.data?.successMessage || '',
    errorMessage: node.data?.errorMessage || '',
    idSourceType: node.data?.idSourceType || 'bot_users',
    messageText: node.data?.messageText || '',
  };

  return generateBroadcastTemplate(params);
}

/**
 * Генерирует обработчик стикеров (sticker)
 * @param node - Узел стикера
 * @returns Сгенерированный Python код
 */
export function generateStickerHandler(node: Node): string {
  const params = {
    nodeId: node.id,
    stickerUrl: node.data?.stickerUrl || '',
    stickerFileId: node.data?.stickerFileId || '',
    stickerSetName: node.data?.stickerSetName || '',
    mediaCaption: node.data?.mediaCaption || '',
    disableNotification: node.data?.disableNotification || false,
  };

  return generateStickerTemplate(params);
}

/**
 * Генерирует обработчик голосовых (voice)
 * @param node - Узел голосового сообщения
 * @returns Сгенерированный Python код
 */
export function generateVoiceHandler(node: Node): string {
  const params = {
    nodeId: node.id,
    voiceUrl: node.data?.voiceUrl || '',
    mediaCaption: node.data?.mediaCaption || '',
    mediaDuration: node.data?.mediaDuration || 0,
    disableNotification: node.data?.disableNotification || false,
  };

  return generateVoiceTemplate(params);
}

/**
 * Генерирует обработчик администрирования (admin)
 * @param node - Узел администрирования
 * @returns Сгенерированный Python код
 */
export function generateAdminHandler(node: Node): string {
  const adminType = node.type as string;
  
  const params: any = {
    nodeId: node.id,
    actionType: adminType,
    synonyms: node.data?.synonyms || [],
    targetMessageId: node.data?.targetMessageId || '',
    messageIdSource: node.data?.messageIdSource || 'last_message',
    targetUserId: node.data?.targetUserId || '',
    userIdSource: node.data?.userIdSource || 'last_message',
    userVariableName: node.data?.userVariableName || '',
    untilDate: node.data?.untilDate || 0,
    reason: node.data?.reason || '',
    muteDuration: node.data?.muteDuration || 0,
    adminTargetUserId: node.data?.adminTargetUserId || '',
    adminUserIdSource: node.data?.adminUserIdSource || 'last_message',
    adminUserVariableName: node.data?.adminUserVariableName || '',
    // Права администратора (camelCase)
    canManageChat: node.data?.can_manage_chat || false,
    canDeleteMessages: node.data?.can_delete_messages || false,
    canBanUsers: node.data?.canBanUsers || false,
    canInviteUsers: node.data?.can_invite_users || false,
    canPinMessages: node.data?.can_pin_messages || false,
    canAddAdmins: node.data?.canAddAdmins || false,
    canRestrictMembers: node.data?.can_restrict_members || false,
    canPromoteMembers: node.data?.can_promote_members || false,
    canManageVideoChats: node.data?.can_manage_video_chats || false,
    canManageTopics: node.data?.can_manage_topics || false,
    isAnonymous: node.data?.is_anonymous || false,
    canChangeInfo: node.data?.can_change_info || false,
  };

  return generateAdminTemplate(params);
}
