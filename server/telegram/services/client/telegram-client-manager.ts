/**
 * @fileoverview Менеджер клиентов Telegram
 * @module server/telegram/services/client/telegram-client-manager
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';
import type { ITelegramClientManager } from './telegram-client-manager-interface.js';
import { TelegramOperationsManager } from './telegram-operations-manager.js';

/**
 * Менеджер клиентов Telegram
 */
export class TelegramClientManager implements ITelegramClientManager {
  private readonly clients: Map<string, TelegramClient>;
  private readonly sessions: Map<string, string>;
  private readonly authStatus: Map<string, AuthStatus>;
  private readonly ops: TelegramOperationsManager;

  constructor() {
    this.clients = new Map();
    this.sessions = new Map();
    this.authStatus = new Map();
    this.ops = new TelegramOperationsManager(this.clients, this.sessions, this.authStatus);
  }

  getClients(): Map<string, TelegramClient> {
    return this.clients;
  }

  initialize(): Promise<void> {
    return this.ops.initialize();
  }

  restoreSession(userId: string): Promise<boolean> {
    return this.ops.restoreSession(userId);
  }

  verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.verifyPassword(userId, password);
  }

  logout(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.logout(userId);
  }

  getAuthStatus(userId: string): Promise<AuthStatus & Record<string, unknown>> {
    return this.ops.auth.getStatus(userId);
  }

  setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.setCredentials(userId, apiId, apiHash);
  }

  createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return this.ops.auth.createClient(userId, config);
  }

  getClient(userId: string): Promise<TelegramClient | null> {
    return this.ops.auth.getClient(userId);
  }

  getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    return this.ops.group.getMembers(userId, chatId);
  }

  getChatInfo(userId: string, chatId: string | number): Promise<any> {
    return this.ops.group.getChatInfo(userId, chatId);
  }

  disconnect(userId: string): Promise<void> {
    return this.ops.disconnect(userId);
  }

  saveSession(userId: string): Promise<string | null> {
    return this.ops.saveSession(userId);
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
