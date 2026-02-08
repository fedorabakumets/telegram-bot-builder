import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { CustomFile } from 'telegram/client/uploads';
import { db } from './db';
import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Интерфейс конфигурации клиента Telegram
 */
interface TelegramClientConfig {
  apiId: string;
  apiHash: string;
  session?: string;
  phoneNumber?: string;
}

/**
 * Интерфейс статуса аутентификации
 */
interface AuthStatus {
  isAuthenticated: boolean;
  phoneNumber?: string | undefined;
  userId?: string | undefined;
  needsCode?: boolean | undefined;
  needsPassword?: boolean | undefined;
}

/**
 * Класс для управления клиентами Telegram
 */
class TelegramClientManager {
  private clients: Map<string, TelegramClient> = new Map();
  private sessions: Map<string, string> = new Map();
  private authStatus: Map<string, AuthStatus> = new Map();

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
      const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
        connectionRetries: 5,
        useWSS: false,
        autoReconnect: true,
      });

      await client.connect();

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
   * Отправить код подтверждения на указанный номер телефона
   * @param userId - ID пользователя
   * @param phoneNumber - Номер телефона для отправки кода
   * @returns Результат операции
   */
  async sendCode(userId: string, phoneNumber: string): Promise<{ success: boolean; phoneCodeHash?: string; error?: string }> {
    try {
      // Получаем credentials из env vars или БД
      let apiId = process.env.TELEGRAM_API_ID;
      let apiHash = process.env.TELEGRAM_API_HASH;

      // Если нет в env vars, пробуем из БД (для backward compatibility)
      if (!apiId || !apiHash) {
        const credentialsResult = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);

        if (credentialsResult.length > 0 && credentialsResult[0].apiId && credentialsResult[0].apiHash) {
          apiId = credentialsResult[0].apiId;
          apiHash = credentialsResult[0].apiHash;
        } else {
          throw new Error('Telegram API credentials not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables.');
        }
      }

      const stringSession = new StringSession('');
      const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
        connectionRetries: 5,
        useWSS: false,
        autoReconnect: true,
      });

      await client.connect();

      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phoneNumber,
          apiId: parseInt(apiId),
          apiHash: apiHash,
          settings: new Api.CodeSettings({
            allowFlashcall: false,
            currentNumber: false,
            allowAppHash: false,
          }),
        })
      );

      // Сохраняем клиент и результат
      this.clients.set(userId, client);
      this.authStatus.set(userId, {
        isAuthenticated: false,
        phoneNumber: phoneNumber,
        userId: userId,
        needsCode: true,
        needsPassword: false
      });

      console.log(`📱 Отправлен код подтверждения на номер ${phoneNumber}`);

      return {
        success: true,
        phoneCodeHash: (result as any).phoneCodeHash
      };

    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка при отправке кода'
      };
    }
  }

  /**
   * Проверить код подтверждения
   * @param userId - ID пользователя
   * @param phoneNumber - Номер телефона
   * @param phoneCode - Введенный код
   * @param phoneCodeHash - Хеш кода
   * @returns Результат проверки
   */
  async verifyCode(userId: string, phoneNumber: string, phoneCode: string, phoneCodeHash: string): Promise<{ success: boolean; error?: string; needsPassword?: boolean }> {
    try {
      const client = this.clients.get(userId);
      if (!client) {
        throw new Error('Клиент не найден. Сначала отправьте код.');
      }

      const signInResult = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: phoneCodeHash,
          phoneCode: phoneCode,
        })
      );

      // Используем результат для подтверждения успешного входа
      if (!signInResult) {
        throw new Error('Не удалось получить данные пользователя после входа');
      }

      // Сохраняем сессию
      const sessionString = (client.session.save() as any) || '';
      this.sessions.set(userId, sessionString);
      await this.saveSessionToDatabase(userId, sessionString, phoneNumber);

      // Обновляем статус авторизации
      this.authStatus.set(userId, {
        isAuthenticated: true,
        phoneNumber: phoneNumber,
        userId: userId,
        needsCode: false,
        needsPassword: false
      });

      console.log(`✅ Пользователь ${phoneNumber} успешно авторизован`);

      return { success: true };

    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);

      // Проверяем, нужен ли пароль для 2FA
      if (error.message && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        // Обновляем статус - требуется пароль
        this.authStatus.set(userId, {
          isAuthenticated: false,
          phoneNumber: phoneNumber,
          userId: userId,
          needsCode: false,
          needsPassword: true
        });

        console.log(`🔐 Требуется пароль 2FA для ${phoneNumber}`);

        return {
          success: false,
          needsPassword: true,
          error: 'Требуется пароль двухфакторной аутентификации'
        };
      }

      return {
        success: false,
        error: error.message || 'Неверный код подтверждения'
      };
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
   * Получить статус аутентификации пользователя
   * @param userId - ID пользователя
   * @returns Статус аутентификации
   */
  async getAuthStatus(userId: string): Promise<AuthStatus & { hasCredentials?: boolean }> {
    const status = this.authStatus.get(userId) || {
      isAuthenticated: false,
      needsCode: false,
      needsPassword: false
    };

    // Проверяем наличие credentials в базе данных
    try {

      const result = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, userId)).limit(1);
      const hasCredentials = !!(result.length > 0 && result[0].apiId && result[0].apiHash);

      return { ...status, hasCredentials };
    } catch (error) {
      console.error('Ошибка проверки credentials:', error);
      return { ...status, hasCredentials: false };
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
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
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
      // Сначала попробуем получить сущность чата
      let chatEntity: any;

      try {
        // Попробуем получить чат по его ID или username
        chatEntity = await client.getEntity(chatId);
      } catch (entityError) {
        console.log('Не удалось получить сущность чата напрямую, пробуем другие методы');

        // Если ID начинается с -100, это супергруппа
        if (typeof chatId === 'string' && chatId.startsWith('-100')) {
          const channelId = chatId.slice(4);
          chatEntity = new Api.PeerChannel({ channelId: channelId as any });
        } else {
          throw new Error(`Не удалось найти чат с ID: ${chatId}`);
        }
      }

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
          // Отладочная информация для понимания структуры данных
          console.log('Participant structure:', {
            participant: participant,
            userId: participant.userId,
            user_id: participant.user_id,
            peer: participant.peer,
            availableKeys: Object.keys(participant)
          });

          // Попробуем разные способы извлечения user ID
          const userId = participant.userId || participant.user_id || participant.peer?.user_id || participant.peer?.userId;
          const user = result.users.find((u: any) => u.id?.toString() === userId?.toString());

          return {
            id: userId?.toString(),
            username: (user as any)?.username || null,
            firstName: (user as any)?.firstName || null,
            lastName: (user as any)?.lastName || null,
            isBot: (user as any)?.bot || false,
            status: this.getParticipantStatus(participant),
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
   * Получить статус участника
   * @param participant - Участник
   * @returns Статус участника
   */
  private getParticipantStatus(participant: any): string {
    if (participant.className === 'ChannelParticipantCreator') return 'creator';
    if (participant.className === 'ChannelParticipantAdmin') return 'administrator';
    if (participant.className === 'ChannelParticipantBanned') return 'kicked';
    return 'member';
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
      let chat: any;
      if (typeof chatId === 'string' && chatId.startsWith('-100')) {
        const channelId = parseInt(chatId.slice(4));
        chat = channelId;
      } else {
        chat = chatId;
      }

      const result = await client.invoke(
        new Api.channels.GetFullChannel({
          channel: chat,
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

      // Получаем сущность пользователя
      const userEntity = await client.getEntity(parseInt(memberId));

      // Исключаем участника
      const result = await client.invoke(
        new Api.channels.EditBanned({
          channel: chatEntity,
          participant: userEntity,
          bannedRights: new Api.ChatBannedRights({
            untilDate: Math.floor(Date.now() / 1000) + 60, // Бан на 60 секунд (фактически исключение)
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
          }),
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

      // Получаем сущность пользователя
      const userEntity = await client.getEntity(parseInt(memberId));

      // Блокируем участника
      const result = await client.invoke(
        new Api.channels.EditBanned({
          channel: chatEntity,
          participant: userEntity,
          bannedRights: new Api.ChatBannedRights({
            untilDate: untilDate || 0, // 0 = навсегда
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
          }),
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

      // Получаем сущность пользователя
      const userEntity = await client.getEntity(parseInt(memberId));

      // Ограничиваем участника
      const result = await client.invoke(
        new Api.channels.EditBanned({
          channel: chatEntity,
          participant: userEntity,
          bannedRights: new Api.ChatBannedRights({
            untilDate: untilDate || Math.floor(Date.now() / 1000) + 3600, // По умолчанию на 1 час
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
          }),
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

      // Получаем сущность пользователя
      const userEntity = await client.getEntity(parseInt(memberId));

      // Назначаем администратором
      const result = await client.invoke(
        new Api.channels.EditAdmin({
          channel: chatEntity,
          userId: userEntity,
          adminRights: new Api.ChatAdminRights({
            changeInfo: adminRights.can_change_info || false,
            postMessages: adminRights.can_post_messages || false,
            editMessages: adminRights.can_edit_messages || false,
            deleteMessages: adminRights.can_delete_messages || false,
            banUsers: adminRights.can_restrict_members || false,
            inviteUsers: adminRights.can_invite_users || false,
            pinMessages: adminRights.can_pin_messages || false,
            addAdmins: adminRights.can_promote_members || false,
            manageCall: adminRights.can_manage_video_chats || false,
            anonymous: adminRights.can_be_anonymous || false,
            manageTopics: adminRights.can_manage_topics || false,
            postStories: adminRights.can_post_stories || false,
            editStories: adminRights.can_edit_stories || false,
            deleteStories: adminRights.can_delete_stories || false,
          }),
          rank: adminRights.custom_title || ''
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

      // Получаем сущность пользователя
      const userEntity = await client.getEntity(parseInt(memberId));

      // Снимаем администраторские права (устанавливаем пустые права)
      const result = await client.invoke(
        new Api.channels.EditAdmin({
          channel: chatEntity,
          userId: userEntity,
          adminRights: new Api.ChatAdminRights({
            changeInfo: false,
            postMessages: false,
            editMessages: false,
            deleteMessages: false,
            banUsers: false,
            inviteUsers: false,
            pinMessages: false,
            addAdmins: false,
            manageCall: false,
            anonymous: false,
            manageTopics: false,
            postStories: false,
            editStories: false,
            deleteStories: false,
          }),
          rank: ''
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