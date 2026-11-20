/** @fileoverview Сохранённые статистика и ответы пользователя внутри общего профиля. */
import type { UserBotData } from '@shared/schema';
import { useUserMessages } from '../hooks/useUserMessages';
import { Statistics } from './Statistics';
import { TagsSection } from './TagsSection';
import { RawJson } from './RawJson';
import { UserResponses } from '../../responses-table/components/UserResponses';

/** Дополнительные разделы профиля во вкладке пользователей. */
interface UserProfileExtrasProps {
  /** Проект открытого пользователя. */ projectId: number;
  /** Бот текущего профиля; отсутствие означает общую область. */ tokenId?: number | null;
  /** Данные пользователя, обновлённые общим профилем. */ user: UserBotData;
}

/**
 * Сохраняет статистику сообщений, теги, ответы и исходные данные без дублирования шапки профиля.
 * @param props - Пользователь и текущая область ботов
 * @returns Дополнительные сведения вкладки пользователей
 */
export function UserProfileExtras({ projectId, tokenId, user }: UserProfileExtrasProps): React.JSX.Element {
  const { total, userSent, botSent } = useUserMessages(projectId, user.userId, tokenId);
  return <div className="space-y-4">
    <Statistics user={user} total={total} userSent={userSent} botSent={botSent} />
    <TagsSection user={user} />
    <UserResponses user={user} />
    <RawJson user={user} />
  </div>;
}
