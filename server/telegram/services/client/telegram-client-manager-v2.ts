/**
 * @fileoverview Фасад консолидированного менеджера Telegram клиентов
 * @module server/telegram/services/client/telegram-client-manager-v2
 * @description Предоставляет единый интерфейс для всех операций Telegram через модули
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';
import { TelegramStore } from './telegram-store.js';
import { AuthModule } from './auth-module.js';
import { SessionModule } from './session-module.js';
import { ChatModule } from './chat-module.js';
import { GroupModule } from './group-module.js';
import { ChatMethods } from './telegram-client-manager-v2-chats.js';
import { GroupMethods } from './telegram-client-manager-v2-groups.js';

/**
 * Консолидированный менеджер клиентов Telegram с модульной архитектурой
 * @description Заменяет устаревшие TelegramClientManager и TelegramOperationsManager
 */
export class TelegramClientManagerV2 {
  /** Модуль авторизации */
  readonly auth: AuthModule;
  /** Модуль сессий */
  readonly session: SessionModule;
  /** Методы для работы с чатами */
  readonly chat: ChatMethods;
  /** Методы для работы с группами */
  readonly group: GroupMethods;

  private readonly store: TelegramStore;

  constructor() {
    this.store = new TelegramStore();
    this.auth = new AuthModule(this.store);
    const chatModule = new ChatModule(this.store);
    const groupModule = new GroupModule(this.store);
    this.session = new SessionModule(this.store);
    this.chat = new ChatMethods(chatModule);
    this.group = new GroupMethods(groupModule);
  }

  /**
   * Получить всех клиентов
   */
  getClients(): Map<string, TelegramClient> {
    return this.store.clients;
  }

  /**
   * Инициализировать менеджер
   */
  async initialize(): Promise<void> {
    return this.session.initialize();
  }

  /**
   * Восстановить сессию пользователя
   */
  async restoreSession(userId: string): Promise<boolean> {
    return this.session.restoreSession(userId);
  }

  /**
   * Проверить 2FA пароль
   */
  async verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    return this.auth.verifyPassword(userId, password);
  }

  /**
   * Выйти из аккаунта
   */
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.auth.logout(userId);
  }

  /**
   * Получить статус авторизации
   */
  async getAuthStatus(userId: string): Promise<AuthStatus> {
    return this.auth.getStatus(userId);
  }

  /**
   * Установить API credentials
   */
  async setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return this.auth.setCredentials(userId, apiId, apiHash);
  }

  /**
   * Создать клиента Telegram
   */
  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return this.auth.createClient(userId, config);
  }

  /**
   * Получить клиента Telegram
   */
  async getClient(userId: string): Promise<TelegramClient | null> {
    return this.auth.getClient(userId);
  }

  /**
   * Отключить клиента
   */
  async disconnect(userId: string): Promise<void> {
    return this.session.disconnect(userId);
  }

  /**
   * Сохранить сессию
   */
  async saveSession(userId: string): Promise<string | null> {
    return this.session.saveSession(userId);
  }
}
