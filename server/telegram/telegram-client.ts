import { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from './types/client/telegram-client-config.js';
import type { AuthStatus } from './types/client/auth-status.js';
import {
  initializeManager,
  restoreSessionWithCheck,
  GroupMemberOperations,
  ChatOperations,
  AuthOperations,
  disconnectWithCheck,
  saveSessionWithCheck,
} from './services/client/index.js';

/**
 * Класс для управления клиентами Telegram
 */
class TelegramClientManager {
  private clients: Map<string, TelegramClient> = new Map();
  private sessions: Map<string, string> = new Map();
  private authStatus: Map<string, AuthStatus> = new Map();
  private groupOps: GroupMemberOperations;
  private chatOps: ChatOperations;
  private authOps: AuthOperations;

  constructor() {
    this.groupOps = new GroupMemberOperations(this.clients);
    this.chatOps = new ChatOperations(this.clients);
    this.authOps = new AuthOperations(this.clients, this.sessions, this.authStatus);
  }

  /**
   * Геттер для доступа к клиентам из routes
   */
  getClients(): Map<string, TelegramClient> {
    return this.clients;
  }

  /**
   * Инициализация менеджера с восстановлением всех сессий
   */
  async initialize(): Promise<void> {
    return initializeManager(this.clients, this.sessions, this.authStatus);
  }

  /**
   * Восстановить клиент из сохраненной сессии
   * @param userId - ID пользователя
   * @returns Успешность восстановления сессии
   */
  async restoreSession(userId: string): Promise<boolean> {
    return restoreSessionWithCheck(userId, this.clients, this.sessions, this.authStatus);
  }

  /**
   * Проверить пароль двухфакторной аутентификации
   * @param userId - ID пользователя
   * @param password - Пароль 2FA
   * @returns Результат проверки
   */
  async verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    return this.authOps.verifyPassword(userId, password);
  }

  /**
   * Выйти из аккаунта Telegram Client API
   * @param userId - ID пользователя
   * @returns Результат выхода
   */
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.authOps.logout(userId);
  }

  /**
   * Получить статус аутентификации пользователя
   * @param userId - ID пользователя
   * @returns Статус аутентификации
   */
  async getAuthStatus(userId: string): Promise<AuthStatus & { hasCredentials?: boolean; isAuthenticated?: boolean; username?: string; phoneNumber?: string }> {
    return this.authOps.getStatus(userId);
  }

  /**
   * Установить учетные данные API для пользователя
   * @param userId - ID пользователя
   * @param apiId - ID API
   * @param apiHash - Хеш API
   * @returns Результат установки
   */
  async setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return this.authOps.setCredentials(userId, apiId, apiHash);
  }

  /**
   * Создать клиента Telegram
   * @param userId - ID пользователя
   * @param config - Конфигурация клиента
   * @returns Клиент Telegram
   */
  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return this.authOps.createClient(userId, config);
  }

  /**
   * Получить клиента Telegram по ID пользователя
   * @param userId - ID пользователя
   * @returns Клиент Telegram или null
   */
  async getClient(userId: string): Promise<TelegramClient | null> {
    return this.authOps.getClient(userId);
  }

  /**
   * Получить список участников группы
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @returns Массив участников группы
   */
  async getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    return this.groupOps.getMembers(userId, chatId);
  }

  /**
   * Получить информацию о чате
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @returns Информация о чате
   */
  async getChatInfo(userId: string, chatId: string | number): Promise<any> {
    return this.groupOps.getChatInfo(userId, chatId);
  }

  /**
   * Отключить клиента
   * @param userId - ID пользователя
   */
  async disconnect(userId: string): Promise<void> {
    const client = this.clients.get(userId);
    return disconnectWithCheck(userId, client, this.clients, this.sessions, this.authStatus);
  }

  /**
   * Сохранить сессию
   * @param userId - ID пользователя
   * @returns Строка сессии или null
   */
  async saveSession(userId: string): Promise<string | null> {
    const client = this.clients.get(userId) ?? null;
    return saveSessionWithCheck(userId, client);
  }

  /**
   * Установить имя пользователя чата
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @param username - Имя пользователя
   * @returns Результат операции
   */
  async setChatUsername(userId: string, chatId: string | number, username: string): Promise<any> {
    return this.chatOps.setUsername(userId, chatId, username);
  }

  /**
   * Установить фото чата
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @param photoPath - Путь к фото
   * @returns Результат операции
   */
  async setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any> {
    return this.chatOps.setPhoto(userId, chatId, photoPath);
  }

  // Исключить участника из группы через Client API
  async kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.groupOps.kick(userId, chatId, memberId);
  }

  // Заблокировать участника через Client API
  async banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.groupOps.ban(userId, chatId, memberId, untilDate);
  }

  // Ограничить участника (мут) через Client API
  async restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    return this.groupOps.restrict(userId, chatId, memberId, untilDate);
  }

  // Назначить участника администратором через Client API
  async promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    return this.groupOps.promote(userId, chatId, memberId, adminRights);
  }

  /**
   * Снять администраторские права
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @param memberId - ID участника
   * @returns Результат операции
   */
  async demoteMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    return this.groupOps.demote(userId, chatId, memberId);
  }
}

export const telegramClientManager = new TelegramClientManager();

/**
 * Функция для инициализации менеджера Telegram
 * @returns Промис инициализации
 */
export function initializeTelegramManager() {
  return telegramClientManager.initialize();
}