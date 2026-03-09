/**
 * @fileoverview Менеджер клиентов Telegram
 * @module server/telegram/services/client/telegram-client-manager
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';
import type { ITelegramClientManager } from './telegram-client-manager-interface.js';
import { SessionManager } from './session-manager.js';
import { UserManager } from './user-manager.js';
import { ChatManager } from './chat-manager.js';

/**
 * Менеджер клиентов Telegram
 */
export class TelegramClientManager implements ITelegramClientManager {
  private readonly session: SessionManager;
  private readonly user: UserManager;
  private readonly chat: ChatManager;

  constructor() {
    const clients = new Map<string, TelegramClient>();
    const sessions = new Map<string, string>();
    const authStatus = new Map<string, AuthStatus>();

    this.session = new SessionManager(clients, sessions, authStatus);
    this.user = new UserManager(clients, sessions, authStatus);
    this.chat = new ChatManager(clients, sessions, authStatus);
  }

  getClients(): Map<string, TelegramClient> {
    return this.session.getClients();
  }

  initialize(): Promise<void> {
    return this.session.initialize();
  }

  restoreSession(userId: string): Promise<boolean> {
    return this.session.restoreSession(userId);
  }

  verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    return this.user.verifyPassword(userId, password);
  }

  logout(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.user.logout(userId);
  }

  getAuthStatus(userId: string): Promise<AuthStatus & Record<string, unknown>> {
    return this.user.getAuthStatus(userId);
  }

  setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return this.user.setCredentials(userId, apiId, apiHash);
  }

  createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return this.user.createClient(userId, config);
  }

  getClient(userId: string): Promise<TelegramClient | null> {
    return this.user.getClient(userId);
  }

  getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    return this.chat.getGroupMembers(userId, chatId);
  }

  getChatInfo(userId: string, chatId: string | number): Promise<any> {
    return this.chat.getChatInfo(userId, chatId);
  }

  disconnect(userId: string): Promise<void> {
    return this.session.disconnect(userId);
  }

  saveSession(userId: string): Promise<string | null> {
    return this.session.saveSession(userId);
  }

  setChatUsername(userId: string, chatId: string | number, username: string): Promise<any> {
    return this.chat.setChatUsername(userId, chatId, username);
  }

  setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any> {
    return this.chat.setChatPhoto(userId, chatId, photoPath);
  }

  kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.chat.kickMember(userId, chatId, memberId);
  }

  banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.chat.banMember(userId, chatId, memberId, untilDate);
  }

  restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.chat.restrictMember(userId, chatId, memberId, untilDate);
  }

  promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    return this.chat.promoteMember(userId, chatId, memberId, adminRights);
  }

  demoteMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.chat.demoteMember(userId, chatId, memberId);
  }
}
