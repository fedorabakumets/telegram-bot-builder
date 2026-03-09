/**
 * @fileoverview Утилита для создания прав блокировки
 * @module server/telegram/utils/client/banned-rights-builder
 */

import { Api } from 'telegram/tl';
import type { BannedRights } from '../../types/client/banned-rights.js';

/**
 * Создаёт объект ChatBannedRights для блокировки участника
 * @param rights - Права доступа
 * @param untilDate - Дата окончания блокировки (0 = навсегда)
 * @returns Объект ChatBannedRights для API вызова
 */
export function createBannedRights(
  rights: BannedRights,
  untilDate: number = 0
): Api.ChatBannedRights {
  return new Api.ChatBannedRights({
    untilDate: untilDate || 0,
    viewMessages: rights.viewMessages ?? true,
    sendMessages: rights.sendMessages ?? true,
    sendMedia: rights.sendMedia ?? true,
    sendStickers: rights.sendStickers ?? true,
    sendGifs: rights.sendGifs ?? true,
    sendGames: rights.sendGames ?? true,
    sendInline: rights.sendInline ?? true,
    embedLinks: rights.embedLinks ?? true,
    sendPolls: rights.sendPolls ?? true,
    changeInfo: rights.changeInfo ?? true,
    inviteUsers: rights.inviteUsers ?? true,
    pinMessages: rights.pinMessages ?? true,
    manageTopics: rights.manageTopics ?? true,
  });
}
