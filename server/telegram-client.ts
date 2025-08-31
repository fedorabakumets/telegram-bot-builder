import { TelegramApi } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

interface TelegramClientConfig {
  apiId: string;
  apiHash: string;
  session?: string;
  phoneNumber?: string;
}

class TelegramClientManager {
  private clients: Map<string, TelegramApi> = new Map();

  async createClient(userId: string, config: TelegramClientConfig): Promise<TelegramApi> {
    const { apiId, apiHash, session } = config;
    
    const stringSession = new StringSession(session || '');
    const client = new TelegramApi(stringSession, parseInt(apiId), apiHash, {
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

  async getClient(userId: string): Promise<TelegramApi | null> {
    return this.clients.get(userId) || null;
  }

  async getGroupMembers(userId: string, chatId: string | number): Promise<any[]> {
    const client = await this.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not found. Please configure your API credentials.');
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
          const user = result.users.find((u: any) => u.id.toString() === participant.userId?.toString());
          return {
            id: participant.userId?.toString(),
            username: user?.username || null,
            firstName: user?.firstName || null,
            lastName: user?.lastName || null,
            isBot: user?.bot || false,
            status: this.getParticipantStatus(participant),
            joinedAt: participant.date ? new Date(participant.date * 1000) : null,
          };
        });
      }

      return [];
    } catch (error) {
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
      throw new Error('Telegram client not found. Please configure your API credentials.');
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
        title: result.chats[0]?.title || 'Unknown',
        participantsCount: result.fullChat.participantsCount,
        about: result.fullChat.about || '',
        chatPhoto: result.chats[0]?.photo || null,
      };
    } catch (error) {
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
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  }

  async saveSession(userId: string): Promise<string | null> {
    const client = this.clients.get(userId);
    if (client && client.session) {
      return client.session.save();
    }
    return null;
  }
}

export const telegramClientManager = new TelegramClientManager();