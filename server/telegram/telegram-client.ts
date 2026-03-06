import { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from './types/client/telegram-client-config.js';
import type { AuthStatus } from './types/client/auth-status.js';
import {
  saveSessionToDb,
  restoreSession,
  initializeManager,
  verifyPasswordWithSession,
  logoutUser,
  getAuthStatus,
  setCredentials,
  createAndStoreClient,
  getClient,
  getGroupMembers,
  getChatInfo,
  kickMember,
  banMember,
  restrictMember,
  promoteMember,
  demoteMember,
  disconnectClient,
  saveSession,
  setChatUsernameWithCheck,
  setChatPhotoWithCheck,
  executeMemberOperation,
} from './services/client/index.js';

/**
 * Класс для управления клиентами Telegram
 */
class TelegramClientManager {
  private clients: Map<string, TelegramClient> = new Map();
  private sessions: Map<string, string> = new Map();
  private authStatus: Map<string, AuthStatus> = new Map();

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
   * Сохранить сессию в базу данных
   * @param userId - ID пользователя
   * @param sessionString - Строка сессии
   * @param phoneNumber - Номер телефона пользователя
   */
  private async saveSessionToDatabase(userId: string, sessionString: string, phoneNumber: string): Promise<void> {
    return saveSessionToDb(userId, sessionString, phoneNumber);
  }


  /**
   * Восстановить клиент из сохраненной сессии
   * @param userId - ID пользователя
   * @returns Успешность восстановления сессии
   */
  async restoreSession(userId: string): Promise<boolean> {
    return restoreSession(userId, this.clients, this.sessions, this.authStatus);
  }





  /**
   * Проверить пароль двухфакторной аутентификации
   * @param userId - ID пользователя
   * @param password - Пароль 2FA
   * @returns Результат проверки
   */
  async verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    const client = this.clients.get(userId);
    if (!client) {
      return { success: false, error: 'Клиент не найден. Сначала отправьте код.' };
    }

    const authStatus = this.authStatus.get(userId);
    if (!authStatus || !authStatus.needsPassword) {
      return { success: false, error: 'Проверка пароля не требуется.' };
    }

    return verifyPasswordWithSession(userId, client, authStatus, password, this.sessions, this.authStatus);
  }

  /**
   * Выйти из аккаунта Telegram Client API
   * @param userId - ID пользователя
   * @returns Результат выхода
   */
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    const client = this.clients.get(userId);

    if (client) {
      return logoutUser(userId, client, this.clients, this.sessions, this.authStatus);
    }

    return { success: false, error: 'Клиент не найден' };
  }

  /**
   * Получить статус аутентификации пользователя
   * @param userId - ID пользователя
   * @returns Статус аутентификации
   */
  async getAuthStatus(userId: string): Promise<AuthStatus & { hasCredentials?: boolean; isAuthenticated?: boolean; username?: string; phoneNumber?: string }> {
    return getAuthStatus(userId);
  }

  /**
   * Установить учетные данные API для пользователя
   * @param userId - ID пользователя
   * @param apiId - ID API
   * @param apiHash - Хеш API
   * @returns Результат установки
   */
  async setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return setCredentials(userId, apiId, apiHash);
  }

  /**
   * Создать клиента Telegram
   * @param userId - ID пользователя
   * @param config - Конфигурация клиента
   * @returns Клиент Telegram
   */
  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return createAndStoreClient(userId, config, this.clients);
  }

  /**
   * Получить клиента Telegram по ID пользователя
   * @param userId - ID пользователя
   * @returns Клиент Telegram или null
   */
  async getClient(userId: string): Promise<TelegramClient | null> {
    return getClient(userId, this.clients);
  }

  /**
   * Получить список участников группы
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @returns Массив участников группы
   */
  async getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    const client = await this.getClient(userId);
    const authStatus = await this.getAuthStatus(userId);
    return executeMemberOperation(client, authStatus, (c) => getGroupMembers(c, chatId));
  }

  /**
   * Получить информацию о чате
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @returns Информация о чате
   */
  async getChatInfo(userId: string, chatId: string | number): Promise<any> {
    const client = await this.getClient(userId);
    return executeMemberOperation(client, undefined, (c) => getChatInfo(c, chatId));
  }

  /**
   * Отключить клиента
   * @param userId - ID пользователя
   */
  async disconnect(userId: string): Promise<void> {
    const client = this.clients.get(userId);
    if (client) {
      await disconnectClient(userId, client, this.clients, this.sessions, this.authStatus);
    }
  }

  /**
   * Сохранить сессию
   * @param userId - ID пользователя
   * @returns Строка сессии или null
   */
  async saveSession(userId: string): Promise<string | null> {
    const client = this.clients.get(userId);
    if (client) {
      return saveSession(client);
    }
    return null;
  }

  /**
   * Установить имя пользователя чата
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @param username - Имя пользователя
   * @returns Результат операции
   */
  async setChatUsername(userId: string, chatId: string | number, username: string): Promise<any> {
    const client = await this.getClient(userId);
    return setChatUsernameWithCheck(userId, client, chatId, username);
  }

  /**
   * Установить фото чата
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @param photoPath - Путь к фото
   * @returns Результат операции
   */
  async setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any> {
    const client = await this.getClient(userId);
    return setChatPhotoWithCheck(userId, client, chatId, photoPath);
  }

  // Исключить участника из группы через Client API
  async kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    const client = await this.getClient(userId);
    return executeMemberOperation(client, undefined, (c) => kickMember(c, chatId, memberId));
  }

  // Заблокировать участника через Client API
  async banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    const client = await this.getClient(userId);
    return executeMemberOperation(client, undefined, (c) => banMember(c, chatId, memberId, untilDate));
  }

  // Ограничить участника (мут) через Client API
  async restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    const client = await this.getClient(userId);
    return executeMemberOperation(client, undefined, (c) => restrictMember(c, chatId, memberId, untilDate));
  }

  // Назначить участника администратором через Client API
  async promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    const client = await this.getClient(userId);
    return executeMemberOperation(client, undefined, (c) => promoteMember(c, chatId, memberId, adminRights));
  }

  /**
   * Снять администраторские права
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @param memberId - ID участника
   * @returns Результат операции
   */
  async demoteMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    const client = await this.getClient(userId);
    return executeMemberOperation(client, undefined, (c) => demoteMember(c, chatId, memberId));
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