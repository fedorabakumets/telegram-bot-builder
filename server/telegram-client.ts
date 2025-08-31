import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

interface TelegramClientConfig {
  apiId: string;
  apiHash: string;
  session?: string;
  phoneNumber?: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  phoneNumber?: string;
  userId?: string;
  needsCode?: boolean;
  needsPassword?: boolean;
}

class TelegramClientManager {
  private clients: Map<string, TelegramClient> = new Map();
  private sessions: Map<string, string> = new Map();
  private authStatus: Map<string, AuthStatus> = new Map();

  async sendCode(userId: string, phoneNumber: string): Promise<{ success: boolean; phoneCodeHash?: string; error?: string }> {
    try {
      const apiId = process.env.TELEGRAM_API_ID;
      const apiHash = process.env.TELEGRAM_API_HASH;
      
      if (!apiId || !apiHash) {
        throw new Error('Telegram API credentials not configured');
      }

      const stringSession = new StringSession('');
      const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
        connectionRetries: 5,
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
      console.error('Ошибка отправки кода:', error);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка при отправке кода'
      };
    }
  }

  async verifyCode(userId: string, phoneNumber: string, phoneCode: string, phoneCodeHash: string): Promise<{ success: boolean; error?: string; needsPassword?: boolean }> {
    try {
      const client = this.clients.get(userId);
      if (!client) {
        throw new Error('Клиент не найден. Сначала отправьте код.');
      }

      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: phoneCodeHash,
          phoneCode: phoneCode,
        })
      );

      // Сохраняем сессию
      const sessionString = client.session.save() as string;
      this.sessions.set(userId, sessionString);

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
      console.error('Ошибка проверки кода:', error);

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

      // Получаем информацию о пароле 2FA
      const passwordSrpResult = await client.invoke(new Api.account.GetPassword());
      
      // Вычисляем SRP данные для пароля
      const srpPassword = await client._computeSrpPassword(passwordSrpResult, password);

      // Проверяем пароль
      const result = await client.invoke(
        new Api.auth.CheckPassword({
          password: srpPassword,
        })
      );

      // Сохраняем сессию
      const sessionString = client.session.save() as string;
      this.sessions.set(userId, sessionString);

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
      console.error('Ошибка проверки пароля:', error);
      return {
        success: false,
        error: error.message || 'Неверный пароль'
      };
    }
  }

  async getAuthStatus(userId: string): Promise<AuthStatus> {
    return this.authStatus.get(userId) || {
      isAuthenticated: false,
      needsCode: false,
      needsPassword: false
    };
  }

  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    const { apiId, apiHash, session } = config;
    
    const stringSession = new StringSession(session || '');
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
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

  async getClient(userId: string): Promise<TelegramClient | null> {
    return this.clients.get(userId) || null;
  }

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
      // Convert string chat ID to proper format
      let chat: any;
      if (typeof chatId === 'string' && chatId.startsWith('-100')) {
        // Supergroup ID format: remove -100 prefix and convert to number
        const channelId = parseInt(chatId.slice(4));
        chat = channelId;
      } else {
        chat = chatId;
      }

      const result = await client.invoke(
        new Api.channels.GetParticipants({
          channel: chat,
          filter: new Api.ChannelParticipantsRecent(),
          offset: 0,
          limit: 200,
          hash: BigInt(0),
        })
      );

      if ('participants' in result) {
        return result.participants.map((participant: any) => {
          const user = result.users.find((u: any) => u.id?.toString() === participant.userId?.toString());
          return {
            id: participant.userId?.toString(),
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
      console.error('Failed to get group members:', error);
      throw new Error(`Failed to get group members: ${error.message || 'Unknown error'}`);
    }
  }

  private getParticipantStatus(participant: any): string {
    if (participant.className === 'ChannelParticipantCreator') return 'creator';
    if (participant.className === 'ChannelParticipantAdmin') return 'administrator';
    if (participant.className === 'ChannelParticipantBanned') return 'kicked';
    return 'member';
  }

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
      console.error('Failed to get chat info:', error);
      throw new Error(`Failed to get chat info: ${error.message || 'Unknown error'}`);
    }
  }

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

  async saveSession(userId: string): Promise<string | null> {
    const client = this.clients.get(userId);
    if (client && client.session) {
      return client.session.save() as string;
    }
    return null;
  }
}

export const telegramClientManager = new TelegramClientManager();