/**
 * @fileoverview Интерфейс менеджера Telegram
 * @module server/telegram/services/client/telegram-client-manager-interface
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';

/**
 * Публичный интерфейс менеджера клиентов Telegram
 */
export interface ITelegramClientManager {
  getClients(): Map<string, TelegramClient>;
  initialize(): Promise<void>;
  restoreSession(userId: string): Promise<boolean>;
  verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }>;
  logout(userId: string): Promise<{ success: boolean; error?: string }>;
  getAuthStatus(userId: string): Promise<AuthStatus & Record<string, unknown>>;
  setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }>;
  createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient>;
  getClient(userId: string): Promise<TelegramClient | null>;
  getGroupMembers(userId: string, chatId: string | number): Promise<any[]>;
  getChatInfo(userId: string, chatId: string | number): Promise<any>;
  disconnect(userId: string): Promise<void>;
  saveSession(userId: string): Promise<string | null>;
  setChatUsername(userId: string, chatId: string | number, username: string): Promise<any>;
  setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any>;
  kickMember(userId: string, chatId: string | number, memberId: string): Promise<any>;
  banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any>;
  restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any>;
  promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any>;
  demoteMember(userId: string, chatId: string | number, memberId: string): Promise<any>;
}
