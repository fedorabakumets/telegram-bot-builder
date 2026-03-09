/**
 * @fileoverview Установка фото чата
 * @module server/telegram/services/client/set-chat-photo
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { CustomFile } from 'telegram/client/uploads';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';

/**
 * Устанавливает фото чата/канала
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param photoPath - Путь к файлу фото
 * @returns Результат операции
 */
export async function setChatPhoto(
  client: TelegramClient,
  chatId: string | number,
  photoPath: string
): Promise<any> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const photoBuffer = fs.readFileSync(photoPath);
    const fileName = path.basename(photoPath);

    const customFile = new CustomFile(fileName, photoBuffer.length, '', photoBuffer);

    const file = await client.uploadFile({
      file: customFile,
      workers: 1,
    });

    const chatEntity = await resolveChatEntity(client, chatId);

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
