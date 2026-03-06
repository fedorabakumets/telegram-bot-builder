import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { TelegramClient } from 'telegram';
import { CustomFile } from 'telegram/client/uploads';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { db } from '../database/db';
import type { TelegramClientConfig } from './types/client/telegram-client-config.js';
import type { AuthStatus } from './types/client/auth-status.js';
import { resolveChatEntity } from './utils/client/chat-entity-resolver.js';
import { resolveUserEntity } from './utils/client/user-entity-resolver.js';
import { createBannedRights } from './utils/client/banned-rights-builder.js';
import { createAdminRights } from './utils/client/admin-rights-builder.js';
import { resolveMemberStatus } from './utils/client/member-status-resolver.js';
import { extractParticipantId } from './utils/client/participant-id-extractor.js';
import {
  saveSessionToDb,
  restoreSession,
  initializeManager,
  verifyPassword,
  logout,
  getAuthStatus,
  setCredentials,
  startClientWithPhone,
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

    const result = await verifyPassword(client, password);

    if (result.success && result.sessionString) {
      this.sessions.set(userId, result.sessionString);
      await this.saveSessionToDatabase(userId, result.sessionString, authStatus.phoneNumber || '');

      this.authStatus.set(userId, {
        isAuthenticated: true,
        phoneNumber: authStatus.phoneNumber,
        userId,
        needsCode: false,
        needsPassword: false,
      });

      console.log(`✅ Пользователь ${authStatus.phoneNumber} успешно авторизован с 2FA`);
    }

    return result;
  }

  /**
   * Выйти из аккаунта Telegram Client API
   * @param userId - ID пользователя
   * @returns Результат выхода
   */
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    const client = this.clients.get(userId);

    if (client) {
      const result = await logout(client);
      if (result.success) {
        this.clients.delete(userId);
        this.sessions.delete(userId);
        this.authStatus.delete(userId);
        console.log(`✅ Пользователь ${userId} вышел из Client API`);
      }
      return result;
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
    const client = await startClientWithPhone(config);
    this.clients.set(userId, client);
    return client;
  }

  /**
   * Получить клиента Telegram по ID пользователя
   * @param userId - ID пользователя
   * @returns Клиент Telegram или null
   */
  async getClient(userId: string): Promise<TelegramClient | null> {
    return this.clients.get(userId) || null;
  }

  /**
   * Получить список участников группы
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @returns Массив участников группы
   */
  async getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    const authStatus = await this.getAuthStatus(userId);
    if (!authStatus.isAuthenticated) {
      throw new Error('User not authenticated. Please complete phone verification first.');
    }

    try {
      // Получаем сущность чата через утилиту
      const chatEntity = await resolveChatEntity(client, chatId);

      const result = await client.invoke(
        new Api.channels.GetParticipants({
          channel: chatEntity,
          filter: new Api.ChannelParticipantsRecent(),
          offset: 0,
          limit: 200,
          hash: 0 as any,
        })
      );

      if ('participants' in result) {
        return result.participants.map((participant: any) => {
          const participantId = extractParticipantId(participant);
          const user = result.users.find((u: any) => u.id?.toString() === participantId?.toString());

          return {
            id: participantId || '',
            username: (user as any)?.username || null,
            firstName: (user as any)?.firstName || null,
            lastName: (user as any)?.lastName || null,
            isBot: (user as any)?.bot || false,
            status: resolveMemberStatus(participant),
            joinedAt: participant.date ? new Date(participant.date * 1000) : null,
          };
        });
      }

      return [];
    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      throw new Error(`Failed to get group members: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Получить информацию о чате
   * @param userId - ID пользователя
   * @param chatId - ID чата
   * @returns Информация о чате
   */
  async getChatInfo(userId: string, chatId: string | number): Promise<any> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    try {
      // Получаем сущность чата через утилиту
      const chatEntity = await resolveChatEntity(client, chatId);

      const result = await client.invoke(
        new Api.channels.GetFullChannel({
          channel: chatEntity,
        })
      );

      return {
        id: result.fullChat.id.toString(),
        title: (result.chats[0] as any)?.title || 'Unknown',
        participantsCount: (result.fullChat as any)?.participantsCount,
        about: (result.fullChat as any)?.about || '',
        chatPhoto: (result.chats[0] as any)?.photo || null,
      };
    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      throw new Error(`Failed to get chat info: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Отключить клиента
   * @param userId - ID пользователя
   */
  async disconnect(userId: string): Promise<void> {
    const client = this.clients.get(userId);
    if (client) {
      try {
        await client.disconnect();
        this.clients.delete(userId);
        this.authStatus.delete(userId);
        this.sessions.delete(userId);
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  }

  /**
   * Сохранить сессию
   * @param userId - ID пользователя
   * @returns Строка сессии или null
   */
  async saveSession(userId: string): Promise<string | null> {
    const client = this.clients.get(userId);
    if (client && client.session) {
      const sessionData = client.session.save();
      return typeof sessionData === 'string' ? sessionData : String(sessionData);
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
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    const authStatus = await this.getAuthStatus(userId);
    if (!authStatus.isAuthenticated) {
      throw new Error('User not authenticated. Please complete phone verification first.');
    }

    try {
      // Получаем сущность чата
      let chatEntity: any;
      try {
        chatEntity = await client.getEntity(chatId);
      } catch (entityError) {
        if (typeof chatId === 'string' && chatId.startsWith('-100')) {
          const channelId = chatId.slice(4);
          chatEntity = new Api.PeerChannel({ channelId: channelId as any });
        } else {
          throw new Error(`Не удалось найти чат с ID: ${chatId}`);
        }
      }

      // Устанавливаем username чата (делаем публичным или приватным)
      const result = await client.invoke(
        new Api.channels.UpdateUsername({
          channel: chatEntity,
          username: username || '', // Пустая строка делает группу приватной
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to set chat username:', error);
      throw new Error(`Failed to set chat username: ${error.message || 'Unknown error'}`);
    }
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
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    const authStatus = await this.getAuthStatus(userId);
    if (!authStatus.isAuthenticated) {
      throw new Error('User not authenticated. Please complete phone verification first.');
    }

    try {
      // Читаем файл
      const fs = await import('fs');
      const path = await import('path');
      const photoBuffer = fs.readFileSync(photoPath);
      const fileName = path.basename(photoPath);

      // Создаем CustomFile из Buffer
      const customFile = new CustomFile(fileName, photoBuffer.length, '', photoBuffer);

      // Загружаем файл в Telegram
      const file = await client.uploadFile({
        file: customFile,
        workers: 1,
      });

      // Получаем сущность чата
      let chatEntity: any;
      try {
        chatEntity = await client.getEntity(chatId);
      } catch (entityError) {
        if (typeof chatId === 'string' && chatId.startsWith('-100')) {
          const channelId = chatId.slice(4);
          chatEntity = new Api.PeerChannel({ channelId: channelId as any });
        } else {
          throw new Error(`Не удалось найти чат с ID: ${chatId}`);
        }
      }

      // Устанавливаем фото чата
      const result = await client.invoke(
        new Api.channels.EditPhoto({
          channel: chatEntity,
          photo: new Api.InputChatUploadedPhoto({ file }),
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to set chat photo:', error);
      throw new Error(`Failed to set chat photo: ${error.message || 'Unknown error'}`);
    }
  }

  // Исключить участника из группы через Client API
  async kickMember(userId: string, chatId: string | number, memberId: string): Promise<any> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    try {
      // Получаем сущности через утилиты
      const chatEntity = await resolveChatEntity(client, chatId);
      const userEntity = await resolveUserEntity(client, parseInt(memberId));

      // Создаём права блокировки через утилиту
      const bannedRights = createBannedRights({
        viewMessages: true,
        sendMessages: true,
        sendMedia: true,
        sendStickers: true,
        sendGifs: true,
        sendGames: true,
        sendInline: true,
        embedLinks: true,
        sendPolls: true,
        changeInfo: true,
        inviteUsers: true,
        pinMessages: true,
        manageTopics: true,
      }, Math.floor(Date.now() / 1000) + 60);

      // Исключаем участника
      const result = await client.invoke(
        new Api.channels.EditBanned({
          channel: chatEntity,
          participant: userEntity,
          bannedRights,
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to kick member:', error);
      throw new Error(`Failed to kick member: ${error.message || 'Unknown error'}`);
    }
  }

  // Заблокировать участника через Client API
  async banMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    try {
      // Получаем сущности через утилиты
      const chatEntity = await resolveChatEntity(client, chatId);
      const userEntity = await resolveUserEntity(client, parseInt(memberId));

      // Создаём права блокировки через утилиту
      const bannedRights = createBannedRights({
        viewMessages: true,
        sendMessages: true,
        sendMedia: true,
        sendStickers: true,
        sendGifs: true,
        sendGames: true,
        sendInline: true,
        embedLinks: true,
        sendPolls: true,
        changeInfo: true,
        inviteUsers: true,
        pinMessages: true,
        manageTopics: true,
      }, untilDate || 0);

      // Блокируем участника
      const result = await client.invoke(
        new Api.channels.EditBanned({
          channel: chatEntity,
          participant: userEntity,
          bannedRights,
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to ban member:', error);
      throw new Error(`Failed to ban member: ${error.message || 'Unknown error'}`);
    }
  }

  // Ограничить участника (мут) через Client API
  async restrictMember(userId: string, chatId: string | number, memberId: string, untilDate?: number): Promise<any> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    try {
      // Получаем сущности через утилиты
      const chatEntity = await resolveChatEntity(client, chatId);
      const userEntity = await resolveUserEntity(client, parseInt(memberId));

      // Создаём права ограничения через утилиту
      const bannedRights = createBannedRights({
        viewMessages: false, // Может видеть сообщения
        sendMessages: true,  // Не может писать
        sendMedia: true,
        sendStickers: true,
        sendGifs: true,
        sendGames: true,
        sendInline: true,
        embedLinks: true,
        sendPolls: true,
        changeInfo: true,
        inviteUsers: true,
        pinMessages: true,
        manageTopics: true,
      }, untilDate || Math.floor(Date.now() / 1000) + 3600);

      // Ограничиваем участника
      const result = await client.invoke(
        new Api.channels.EditBanned({
          channel: chatEntity,
          participant: userEntity,
          bannedRights,
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to restrict member:', error);
      throw new Error(`Failed to restrict member: ${error.message || 'Unknown error'}`);
    }
  }

  // Назначить участника администратором через Client API
  async promoteMember(userId: string, chatId: string | number, memberId: string, adminRights: any): Promise<any> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    try {
      // Получаем сущности через утилиты
      const chatEntity = await resolveChatEntity(client, chatId);
      const userEntity = await resolveUserEntity(client, parseInt(memberId));

      // Создаём права администратора через утилиту
      const rights = createAdminRights({
        can_change_info: adminRights.can_change_info,
        can_post_messages: adminRights.can_post_messages,
        can_edit_messages: adminRights.can_edit_messages,
        can_delete_messages: adminRights.can_delete_messages,
        can_restrict_members: adminRights.can_restrict_members,
        can_invite_users: adminRights.can_invite_users,
        can_pin_messages: adminRights.can_pin_messages,
        can_promote_members: adminRights.can_promote_members,
        can_manage_video_chats: adminRights.can_manage_video_chats,
        can_be_anonymous: adminRights.can_be_anonymous,
        can_manage_topics: adminRights.can_manage_topics,
        can_post_stories: adminRights.can_post_stories,
        can_edit_stories: adminRights.can_edit_stories,
        can_delete_stories: adminRights.can_delete_stories,
      });

      // Назначаем администратором
      const result = await client.invoke(
        new Api.channels.EditAdmin({
          channel: chatEntity,
          userId: userEntity,
          adminRights: rights,
          rank: adminRights.custom_title || '',
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to promote member:', error);
      throw new Error(`Failed to promote member: ${error.message || 'Unknown error'}`);
    }
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
    if (!client) {
      throw new Error('Telegram client not found. Please authenticate first.');
    }

    try {
      // Получаем сущности через утилиты
      const chatEntity = await resolveChatEntity(client, chatId);
      const userEntity = await resolveUserEntity(client, parseInt(memberId));

      // Создаём пустые права администратора через утилиту
      const rights = createAdminRights({
        can_change_info: false,
        can_post_messages: false,
        can_edit_messages: false,
        can_delete_messages: false,
        can_restrict_members: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_promote_members: false,
        can_manage_video_chats: false,
        can_be_anonymous: false,
        can_manage_topics: false,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
      });

      // Снимаем администраторские права
      const result = await client.invoke(
        new Api.channels.EditAdmin({
          channel: chatEntity,
          userId: userEntity,
          adminRights: rights,
          rank: '',
        })
      );

      return result;
    } catch (error: any) {
      console.error('Failed to demote member:', error);
      throw new Error(`Failed to demote member: ${error.message || 'Unknown error'}`);
    }
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