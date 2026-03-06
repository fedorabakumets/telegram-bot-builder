/**
 * @fileoverview Менеджер клиентов Telegram
 * @module server/telegram/services/client/telegram-client-manager
 */

import { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';
import { TelegramOperationsManager } from './telegram-operations-manager.js';

/**
 * Класс для управления клиентами Telegram
 */
export class TelegramClientManager {
  private clients: Map<string, TelegramClient> = new Map();
  private sessions: Map<string, string> = new Map();
  private authStatus: Map<string, AuthStatus> = new Map();
  private ops: TelegramOperationsManager;

  constructor() {
    this.ops = new TelegramOperationsManager(this.clients, this.sessions, this.authStatus);
  }

  /**
   * Геттер для доступа к клиентам из routes
   */
  getClients(): Map<string, TelegramClient> {
    return this.clients;
  }

  /**
   * Инициализация менеджера
   */
  async initialize(): Promise<void> {
    return this.ops.initialize();
  }

  /**
   * Восстановить сессию
   */
  async restoreSession(userId: string): Promise<boolean> {
    return this.ops.restoreSession(userId);
  }

  /**
   * Проверить 2FA пароль
   */
  async verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.verifyPassword(userId, password);
  }

  /**
   * Выйти
   */
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.logout(userId);
  }

  /**
   * Получить статус авторизации
   */
  async getAuthStatus(userId: string): Promise<AuthStatus & { hasCredentials?: boolean; isAuthenticated?: boolean; username?: string; phoneNumber?: string }> {
    return this.ops.auth.getStatus(userId);
  }

  /**
   * Установить credentials
   */
  async setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.setCredentials(userId, apiId, apiHash);
  }

  /**
   * Создать клиента
   */
  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return this.ops.auth.createClient(userId, config);
  }

  /**
   * Получить клиента
   */
  async getClient(userId: string): Promise<TelegramClient | null> {
    return this.ops.auth.getClient(userId);
  }

  /**
   * Получить участников группы
   */
  async getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    return this.ops.group.getMembers(userId, chatId);
  }

  /**
   * Получить информацию о чате
   */
  async getChatInfo(userId: string, chatId: string | number): Promise<any> {
    return this.ops.group.getChatInfo(userId, chatId);
  }

  /**
   * Отключить клиента
   */
  async disconnect(userId: string): Promise<void> {
    return this.ops.disconnect(userId);
  }

  /**
   * Сохранить сессию
   */
  async saveSession(userId: string): Promise<string | null> {
    return this.ops.saveSession(userId);
  }

  /**
   * Установить username чата
   */
  async setChatUsername(userId: string, chatId: string | number, username: string): Promise<any> {
    return this.ops.chat.setUsername(userId, chatId, username);
  }

  /**
   * Установить фото чата
   */
  async setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any> {
    return this.ops.chat.setPhoto(userId, chatId, photoPath);
  }

  /**
   * Исключить участника
   */
  async kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.ops.group.kick(userId, chatId, memberId);
  }

  /**
   * Заблокировать участника
   */
  async banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.ops.group.ban(userId, chatId, memberId, untilDate);
  }

  /**
   * Ограничить участника
   */
  async restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.ops.group.restrict(userId, chatId, memberId, untilDate);
  }

  /**
   * Назначить администратором
   */
  async promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    return this.ops.group.promote(userId, chatId, memberId, adminRights);
  }

  /**
   * Снять администраторство
   */
  async demoteMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.ops.group.demote(userId, chatId, memberId);
  }
}
