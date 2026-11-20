/** @fileoverview Общая идентификация и состояние доступа в шапке диалога. */
import { useState } from 'react';
import { Radio, Users } from 'lucide-react';
import type { UserBotData } from '@/types/bot';
import { UserAvatar } from '../../dialog/components/user-avatar';
import { formatUserName } from '../../utils';
import { useGroupAccess } from '../hooks/use-group-access';
import { GroupAccessStatus } from './group-access-status';
import { dialogAccessStatus } from './dialog-access-status';
import type { GroupAccessData } from '../hooks/group-sync-request';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { statusAppearance } from '@shared/status-appearance';
import { DialogHistoryBotSelect, type DialogHistoryBotSelectProps } from './dialog-history-bot-select';

/** Свойства общей шапки. */
interface Props extends Omit<DialogHistoryBotSelectProps, 'memberships'> {
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
 * Показывает имя чата над статусом доступа, сохраняя читаемость на узком экране.
 * @param props - Диалог и область бота
 * @returns Название, аватарка, статус и ручная проверка
 */
export function DialogHeaderIdentity({ user, projectId, tokenId, onOpenProfile, tokens,
  historyTokenId, onHistoryTokenChange, replyTokenId, onReplyTokenChange }: Props) {
  /** Состояние и профиль привязаны к конкретному отправителю, даже в общей ленте. */
  const accessTokenId = replyTokenId ?? historyTokenId ?? tokenId;
  const membership = user.botMemberships?.find(item => item.tokenId === accessTokenId);
  /** Подпись отправителя использует общий кэш ботов проекта для всех размеров шапки. */
  const tokensInfo = useProjectTokens([projectId]);
  const bot = tokensInfo[0]?.tokens.find(item => item.id === accessTokenId);
  const botName = bot?.botFirstName || bot?.name;
  const botLabel = bot?.botUsername
    ? `${botName ? `${botName} ` : ''}(@${bot.botUsername.replace(/^@/, '')})`
    : botName || (accessTokenId != null ? `Бот #${accessTokenId}` : null);
  const meta = user as UserBotData & {
    /** Флаг группового чата. */
    isGroup?: boolean;
    /** Тип группового чата. */
    chatType?: string;
    /** Сохранённый результат проверки из строки общего списка. */
    accessStatus?: GroupAccessData['status'];
  };
  const chatType = meta.isGroup ? (meta.chatType ?? 'group') : 'private';
  const { data, check, botAvailability } = useGroupAccess(projectId, accessTokenId, String(user.userId), chatType);
  /** Общая строка пользователя не подменяет признаки выбранного для ответа бота. */
  const accessEntry = !meta.isGroup && user.botMemberships
    ? { isBlocked: membership?.isBlocked ?? false } : meta;
  const accessStatus = dialogAccessStatus(accessEntry, data?.status);
  const availability = membership?.botAvailability || botAvailability;
  /** Сохранённый флаг активности не подтверждает доступность бота или пользователя. */
  const plainStatus = !meta.isGroup && membership?.isDeleted && !availability ? 'Аккаунт удалён' : null;
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photo = data?.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl;
  const name = meta.isGroup ? (data?.name ?? user.firstName ?? String(user.userId)) : formatUserName(user);
  const Icon = meta.chatType === 'channel' ? Radio : Users;
  return <div className="flex flex-col items-stretch gap-1 min-w-0 flex-1">
    <button type="button" onClick={onOpenProfile} aria-label={meta.isGroup ? `Открыть профиль группы ${name}` : `Открыть профиль пользователя ${name}`} className="flex w-full min-w-0 shrink-0 items-center gap-2 rounded-md text-left hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    {meta.isGroup ? (
      photo && photo !== failedPhoto
        ? <img src={photo} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" onError={() => setFailedPhoto(photo)} />
        : <span className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5" /></span>
    ) : <UserAvatar messageType="user" user={user} projectId={projectId} tokenId={accessTokenId} size={24} />}
    <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">{name}</span>
    </button>
    {botLabel && <p className="min-w-0 break-words text-xs leading-snug text-muted-foreground">Через бота: {botLabel}</p>}
    {!meta.isGroup && <DialogHistoryBotSelect tokens={tokens} memberships={user.botMemberships}
      historyTokenId={historyTokenId} onHistoryTokenChange={onHistoryTokenChange}
      replyTokenId={replyTokenId} onReplyTokenChange={onReplyTokenChange} />}
    {plainStatus && <span className="self-start text-[11px]" style={statusAppearance(plainStatus)}>{plainStatus}</span>}
    <GroupAccessStatus status={accessStatus} chatType={chatType} botAvailability={availability} onCheck={() => { void check(); }} />
  </div>;
}
