/**
 * @fileoverview Аватар рядом с пузырьком сообщения в Диалогах
 * @module client/components/editor/database/dialog/components/message-avatar
 */

import { UserAvatar } from './user-avatar';
import { UserBotData } from '@shared/schema';

/** Свойства аватара сообщения */
interface MessageAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя (для аватара user) */
  user?: UserBotData | null;
  /** Данные бота (опционально; для фото бота достаточно projectId) */
  bot?: UserBotData | null;
  /** ID проекта для прокси аватара */
  projectId?: number;
  /** ID токена бота (`/users/bot/avatar?tokenId=`) */
  tokenId?: number | null;
}

/**
 * Аватар сообщения: для бота — тот же прокси, что на вкладке «Бот»
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function MessageAvatar({ messageType, user, bot, projectId, tokenId }: MessageAvatarProps) {
  const avatarData = messageType === 'bot' ? bot : user;
  return <UserAvatar messageType={messageType} user={avatarData} projectId={projectId} tokenId={tokenId} />;
}
