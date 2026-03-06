/**
 * @fileoverview Интерфейсы для модулей Telegram клиента
 * @module server/telegram/types/client/modules
 * @description Определяет контракты для всех модулей операций
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from './telegram-client-config.js';
import type { AuthStatus } from './auth-status.js';

/**
 * Интерфейс модуля авторизации
 */
export interface IAuthModule {
  /**
   * Получить статус авторизации пользователя
   */
  getStatus(userId: string): Promise<AuthStatus>;
  /**
   * Установить API credentials
   */
  setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }>;
  /**
   * Создать клиента Telegram
   */
  createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient>;
  /**
   * Получить клиента Telegram
   */
  getClient(userId: string): Promise<TelegramClient | null>;
  /**
   * Проверить 2FA пароль
   */
  verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }>;
  /**
   * Выйти из аккаунта
   */
  logout(userId: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Интерфейс модуля сессий
 */
export interface ISessionModule {
  /**
   * Инициализировать менеджер сессий
   */
  initialize(): Promise<void>;
  /**
   * Восстановить сессию пользователя
   */
  restoreSession(userId: string): Promise<boolean>;
  /**
   * Сохранить сессию пользователя
   */
  saveSession(userId: string): Promise<string | null>;
  /**
   * Отключить клиента
   */
  disconnect(userId: string): Promise<void>;
}

/**
 * Интерфейс модуля чатов
 */
export interface IChatModule {
  /**
   * Установить username чата
   */
  setChatUsername(userId: string, chatId: string | number, username: string): Promise<any>;
  /**
   * Установить фото чата
   */
  setChatPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any>;
  /**
   * Получить информацию о чате
   */
  getChatInfo(userId: string, chatId: string | number): Promise<any>;
}

/**
 * Интерфейс модуля групп
 */
export interface IGroupModule {
  /**
   * Получить список участников группы
   */
  getMembers(userId: string, chatId: string | number): Promise<any[]>;
  /**
   * Исключить участника
   */
  kick(userId: string, chatId: string | number, memberId: string): Promise<any>;
  /**
   * Заблокировать участника
   */
  ban(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any>;
  /**
   * Ограничить участника
   */
  restrict(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any>;
  /**
   * Назначить администратором
   */
  promote(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any>;
  /**
   * Снять администраторство
   */
  demote(userId: string, chatId: string | number, memberId: string): Promise<any>;
}
