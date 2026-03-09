/**
 * @fileoverview Менеджер чатов Telegram
 * @module server/telegram/services/client/chat-manager
 */

import { TelegramOperationsManager } from './telegram-operations-manager.js';
import type { TelegramClient } from 'telegram';
import type { AuthStatus } from '../../types/client/auth-status.js';

/**
 * Менеджер чатов Telegram
 */
export class ChatManager {
  private readonly ops: TelegramOperationsManager;

  constructor(
    clients: Map<string, TelegramClient>,
    sessions: Map<string, string>,
    authStatus: Map<string, AuthStatus>
  ) {
    this.ops = new TelegramOperationsManager(clients, sessions, authStatus);
  }

  getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    return this.ops.group.getMembers(userId, chatId);
  }

  getChatInfo(userId: string, chatId: string | number): Promise<any> {
    return this.ops.group.getChatInfo(userId, chatId);
  }

  setChatUsername(userId: string, chatId: string | number, username: string): Promise<any> {
    return this.ops.chat.setUsername(userId, chatId, username);
  }

  setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any> {
    return this.ops.chat.setPhoto(userId, chatId, photoPath);
  }

  kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.ops.group.kick(userId, chatId, memberId);
  }

  banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.ops.group.ban(userId, chatId, memberId, untilDate);
  }

  restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.ops.group.restrict(userId, chatId, memberId, untilDate);
  }

  promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    return this.ops.group.promote(userId, chatId, memberId, adminRights);
  }

  demoteMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.ops.group.demote(userId, chatId, memberId);
  }
}
