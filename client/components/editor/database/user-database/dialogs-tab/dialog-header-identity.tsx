/** @fileoverview Общая идентификация и состояние доступа в шапке диалога. */
import { useState } from 'react';
import { Radio, Users } from 'lucide-react';
import type { UserBotData } from '@/types/bot';
import { UserAvatar } from '../../dialog/components/user-avatar';
import { formatUserName } from '../../utils';
import { useGroupAccess } from '../hooks/use-group-access';
import { GroupAccessStatus } from './group-access-status';

/** Свойства общей шапки. */
interface Props {
  /** Текущий диалог. */
  user: UserBotData;
  /** Проект. */
  projectId: number;
  /** Выбранный бот. */
  tokenId?: number | null;
  /** Открывает сведения текущего диалога. */
  onOpenProfile?: () => void;
}

/**
 * Показывает актуальные данные выбранного чата на всех размерах экрана.
 * @param props - Диалог и область бота
 * @returns Название, аватарка, статус и ручная проверка
 */
export function DialogHeaderIdentity({ user, projectId, tokenId, onOpenProfile }: Props) {
  const meta = user as UserBotData & {
    /** Флаг группового чата. */
    isGroup?: boolean;
    /** Тип группового чата. */
    chatType?: string;
  };
  const chatType = meta.isGroup ? (meta.chatType ?? 'group') : 'private';
  const { data, check } = useGroupAccess(projectId, tokenId, String(user.userId), chatType);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photo = data?.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl;
  const name = meta.isGroup ? (data?.name ?? user.firstName ?? String(user.userId)) : formatUserName(user);
  const Icon = meta.chatType === 'channel' ? Radio : Users;
  return <div className="flex items-center gap-2 min-w-0 flex-1">
    <button type="button" onClick={onOpenProfile} aria-label={meta.isGroup ? `Открыть профиль группы ${name}` : `Открыть профиль пользователя ${name}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    {meta.isGroup ? (
      photo && photo !== failedPhoto
        ? <img src={photo} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" onError={() => setFailedPhoto(photo)} />
        : <span className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5" /></span>
    ) : <UserAvatar messageType="user" user={user} projectId={projectId} tokenId={tokenId} size={24} />}
    <span className="min-w-0 flex-1 text-sm font-medium truncate">{name}</span>
    </button>
    <GroupAccessStatus status={data?.status} chatType={chatType} onCheck={() => { void check(); }} />
  </div>;
}
