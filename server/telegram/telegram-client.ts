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
    try {

      const allSessions = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.isActive, 1));

      console.log(`🔄 Восстанавливаем ${allSessions.length} сессий из базы данных...`);

      for (const sessionData of allSessions) {
        if (sessionData.sessionString && sessionData.userId) {
          await this.restoreSession(sessionData.userId);
        }
      }

      console.log('✅ Все сессии восстановлены');
    } catch (error) {
      console.error('Ошибка при восстановлении сессий:', error);
    }
  }

  /**
   * Сохранить сессию в базу данных
   * @param userId - ID пользователя
   * @param sessionString - Строка сессии
   * @param phoneNumber - Номер телефона пользователя
   */
  private async saveSessionToDatabase(userId: string, sessionString: string, phoneNumber: string): Promise<void> {
    try {

      const existing = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);

      if (existing.length > 0) {
        await db.update(userTelegramSettings)
          .set({
            sessionString,
            phoneNumber,
            updatedAt: new Date()
          })
          .where(eq(userTelegramSettings.userId, userId));
      } else {
        await db.insert(userTelegramSettings).values({
          userId,
          sessionString,
          phoneNumber
        });
      }
      console.log(`💾 Сессия сохранена в БД для пользователя ${phoneNumber}`);
    } catch (error) {
      console.error('Ошибка сохранения сессии в БД:', error);
    }
  }

  /**
   * Загрузить сессию из базы данных
   * @param userId - ID пользователя
   * @returns Строка сессии или null, если не найдена
   */
  private async loadSessionFromDatabase(userId: string): Promise<string | null> {
    try {

      const result = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);

      if (result.length > 0 && result[0].sessionString) {
        console.log(`🔄 Сессия загружена из БД для пользователя ${userId}`);
        return result[0].sessionString;
      }
      return null;
    } catch (error) {
      console.error('Ошибка загрузки сессии из БД:', error);
      return null;
    }
  }

  /**
   * Восстановить клиент из сохраненной сессии
   * @param userId - ID пользователя
   * @returns Успешность восстановления сессии
   */
  async restoreSession(userId: string): Promise<boolean> {
    try {
      const sessionString = await this.loadSessionFromDatabase(userId);
      if (!sessionString) {
        return false;
      }

      // Получаем credentials из env vars или БД
      let apiId = process.env.TELEGRAM_API_ID;
      let apiHash = process.env.TELEGRAM_API_HASH;

      // Если нет в env vars, пробуем из БД
      if (!apiId || !apiHash) {
        const result = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);

        if (result.length > 0 && result[0].apiId && result[0].apiHash) {
          apiId = result[0].apiId;
          apiHash = result[0].apiHash;
        } else {
          console.log(`❌ API credentials не найдены для пользователя ${userId}`);
          return false;
        }
      }

      const stringSession = new StringSession(sessionString);
      const client = new TelegramClient(stringSession, parseInt(apiId!), apiHash!, {
        connectionRetries: 5,
        useWSS: false,
        autoReconnect: true,
      });

      await client.connect();

      // Отключаем updateLoop чтобы избежать TIMEOUT ошибок
      (client as any)._updateLoop = () => {};

      // Проверяем, что сессия действительна
      const me = await client.getMe();
      if (me) {
        this.clients.set(userId, client);
        this.sessions.set(userId, sessionString);
        this.authStatus.set(userId, {
          isAuthenticated: true,
          phoneNumber: (me as any).phone,
          userId: userId,
          needsCode: false,
          needsPassword: false
        });
        console.log(`✅ Сессия восстановлена для пользователя ${userId}`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      return false;
    }
  }





  /**
   * Проверить пароль двухфакторной аутентификации
   * @param userId - ID пользователя
   * @param password - Пароль 2FA
   * @returns Результат проверки
   */
  async verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.clients.get(userId);
      if (!client) {
        throw new Error('Клиент не найден. Сначала отправьте код.');
      }

      const authStatus = this.authStatus.get(userId);
      if (!authStatus || !authStatus.needsPassword) {
        throw new Error('Проверка пароля не требуется.');
      }

      // Получаем данные для 2FA аутентификации
      const passwordInfo = await client.invoke(new Api.account.GetPassword());

      // Импортируем необходимые модули для работы с SRP
      const { computeCheck } = await import('telegram/Password');

      // Вычисляем правильный хеш пароля
      const passwordCheck = await computeCheck(passwordInfo, password);

      // Используем прямой API вызов для проверки пароля
      await client.invoke(
        new Api.auth.CheckPassword({
          password: passwordCheck
        })
      );

      // Сохраняем сессию
      const sessionString = (client.session.save() as any) || '';
      this.sessions.set(userId, sessionString);
      await this.saveSessionToDatabase(userId, sessionString, authStatus.phoneNumber || '');

      // Обновляем статус авторизации
      this.authStatus.set(userId, {
        isAuthenticated: true,
        phoneNumber: authStatus.phoneNumber,
        userId: userId,
        needsCode: false,
        needsPassword: false
      });

      console.log(`✅ Пользователь ${authStatus.phoneNumber} успешно авторизован с 2FA`);

      return { success: true };

    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      return {
        success: false,
        error: error.message === 'PASSWORD_HASH_INVALID' ? 'Неверный пароль' : (error.message || 'Ошибка авторизации')
      };
    }
  }

  /**
   * Выйти из аккаунта Telegram Client API
   * @param userId - ID пользователя
   * @returns Результат выхода
   */
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.clients.get(userId);
      
      // Закрываем соединение если клиент существует
      if (client) {
        try {
          await client.disconnect();
        } catch (disconnectError) {
          console.error('Ошибка при отключении клиента:', disconnectError);
        }
        this.clients.delete(userId);
      }

      // Очищаем сессию
      this.sessions.delete(userId);

      // Очищаем статус авторизации
      this.authStatus.delete(userId);

      console.log(`✅ Пользователь ${userId} вышел из Client API`);

      return { success: true };
    } catch (error: any) {
      console.error('Ошибка при выходе:', error);
      return { success: false, error: error.message || 'Ошибка при выходе' };
    }
  }

  /**
   * Получить статус аутентификации пользователя
   * @param userId - ID пользователя
   * @returns Статус аутентификации
   */
  async getAuthStatus(userId: string): Promise<AuthStatus & { hasCredentials?: boolean; isAuthenticated?: boolean; username?: string; phoneNumber?: string }> {
    // Проверяем наличие credentials в базе данных
    try {
      const result = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);
      
      if (result.length === 0) {
        return { 
          isAuthenticated: false, 
          needsCode: false, 
          needsPassword: false,
          hasCredentials: false 
        };
      }

      const row = result[0];
      const hasCredentials = !!(row.apiId && row.apiHash);
      const hasSession = !!row.sessionString;

      // Если есть сессия — считаем пользователя авторизованным и получаем информацию
      if (hasSession && row.apiId && row.apiHash) {
        try {
          const client = new TelegramClient(
            new StringSession(row.sessionString ?? undefined),
            parseInt(row.apiId),
            row.apiHash ?? undefined,
            {
              connectionRetries: 5,
              useWSS: false,
            }
          );

          await client.connect();
          const me = await client.getMe();

          console.log('📊 getMe() результат:', JSON.stringify({
            id: me?.id,
            userId: (me as any).userId,
            username: me?.username,
            phone: (me as any).phone,
            firstName: me?.firstName
          }, null, 2));

          // Не отключаем клиента — он может использоваться в других местах

          return {
            isAuthenticated: true,
            needsCode: false,
            needsPassword: false,
            hasCredentials: true,
            username: me?.username || undefined,
            phoneNumber: (me as any).phone || undefined,
            userId: (me as any).userId?.toString() || me?.id?.toString()
          };
        } catch (error) {
          console.error('Ошибка получения информации о пользователе:', error);
          // Возвращаем статус без username/phoneNumber если не удалось получить
          return {
            isAuthenticated: true,
            needsCode: false,
            needsPassword: false,
            hasCredentials: true
          };
        }
      }

      // Если credentials есть, но сессии нет — ждём код
      return { 
        isAuthenticated: false, 
        needsCode: hasCredentials, 
        needsPassword: false,
        hasCredentials
      };
    } catch (error) {
      console.error('Ошибка проверки credentials:', error);
      return { 
        isAuthenticated: false, 
        needsCode: false, 
        needsPassword: false, 
        hasCredentials: false 
      };
    }
  }

  /**
   * Установить учетные данные API для пользователя
   * @param userId - ID пользователя
   * @param apiId - ID API
   * @param apiHash - Хеш API
   * @returns Результат установки
   */
  async setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    try {

      const existing = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);

      if (existing.length > 0) {
        await db.update(userTelegramSettings)
          .set({
            apiId,
            apiHash,
            updatedAt: new Date()
          })
          .where(eq(userTelegramSettings.userId, userId));
      } else {
        await db.insert(userTelegramSettings).values({
          userId,
          apiId,
          apiHash
        });
      }

      console.log(`💾 API credentials сохранены для пользователя ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Ошибка сохранения credentials:', error);
      return {
        success: false,
        error: error.message || 'Ошибка сохранения credentials'
      };
    }
  }

  /**
   * Создать клиента Telegram
   * @param userId - ID пользователя
   * @param config - Конфигурация клиента
   * @returns Клиент Telegram
   */
  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    const { apiId, apiHash, session } = config;

    const stringSession = new StringSession(session || '');
    const client = new TelegramClient(stringSession, parseInt(apiId!), apiHash!, {
      connectionRetries: 5,
      useWSS: false,
      autoReconnect: true,
    });

    try {
      await client.start({
        phoneNumber: config.phoneNumber || '',
        password: async () => {
          throw new Error('2FA not supported in this implementation');
        },
        phoneCode: async () => {
          throw new Error('Phone code verification not implemented');
        },
        onError: (err) => console.error('Telegram client error:', err),
      });

      this.clients.set(userId, client);
      return client;
    } catch (error) {
      console.error('Failed to start Telegram client:', error);
      throw error;
    }
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