/**
 * @fileoverview Боковая карточка сведений о собеседнике или группе.
 */
import { useState, type ReactNode } from 'react';
import { CalendarDays, Clock3, Users, UserRound, X, ZoomIn } from 'lucide-react';
import type { UserBotData } from '@/types/bot';
import { UserAvatar } from './user-avatar';
import { ImageLightbox } from './image-lightbox';

/** Свойства панели профиля диалога. */
export interface DialogProfileProps {
  /** Данные открытого пользователя или группы. */
  user: UserBotData;
  /** Идентификатор проекта для загрузки фотографии. */
  projectId: number;
  /** Идентификатор выбранного бота. */
  tokenId?: number | null;
  /** Закрывает панель профиля. */
  onClose: () => void;
  /** Дополнительные сведения, загруженные родительским компонентом. */
  children?: ReactNode;
}

/**
 * Возвращает удобочитаемую дату или отсутствие значения.
 * @param value - Дата из данных диалога.
 * @returns Дата на русском языке либо null.
 */
function profileDate(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

/**
 * Показывает сведения открытого чата в самостоятельной боковой панели.
 * @param props - Свойства панели профиля.
 * @returns Панель с аватаром и доступными сведениями.
 */
export function DialogProfile({ user, projectId, tokenId, onClose, children }: DialogProfileProps) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  /** Открыта ли увеличенная фотография группы. */
  const [photoOpen, setPhotoOpen] = useState(false);
  const isGroup = user.isGroup || String(user.userId).startsWith('-');
  const title = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || String(user.userId);
  const groupType = user.chatType === 'channel' ? 'Канал' : user.chatType === 'supergroup' ? 'Супергруппа' : 'Группа';
  const registered = profileDate(user.registeredAt ?? user.createdAt);
  const lastInteraction = profileDate(user.lastInteraction ?? user.lastMessageAt);
  const groupPhoto = isGroup && user.avatarUrl && user.avatarUrl !== failedAvatar;

  return (
    <aside aria-label={isGroup ? 'Профиль группы' : 'Профиль пользователя'}
      className="flex h-full min-h-0 w-full flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">{isGroup ? 'О группе' : 'О пользователе'}</h2>
        <button type="button" onClick={onClose} aria-label="Закрыть профиль"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-5 pb-6 pt-7 text-center">
          {isGroup ? groupPhoto ? (
            <button type="button" onClick={() => setPhotoOpen(true)} aria-label="Увеличить фотографию группы"
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <img src={user.avatarUrl!} alt="" className="h-full w-full object-cover"
                onError={() => setFailedAvatar(user.avatarUrl ?? null)} />
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn className="h-6 w-6" />
              </span>
            </button>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="h-9 w-9" />
            </div>
          ) : <UserAvatar messageType="user" user={user} projectId={projectId} tokenId={tokenId} size={80} />}
          <h3 className="mt-4 max-w-full break-words text-base font-semibold">{title}</h3>
          {isGroup && <p className="mt-1 text-sm text-muted-foreground">{groupType}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            {user.userName ? `@${user.userName.replace(/^@/, '')}` : 'Username неизвестен'}
          </p>
          {!isGroup && user.isBlocked && <span className="mt-3 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-600 dark:text-amber-400">Заблокировал бота</span>}
        </div>
        <div className="space-y-4 border-t px-5 py-4">
          <h3 className="text-xs font-medium text-muted-foreground">Информация</h3>
          <div className="flex items-start gap-3 text-sm">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0"><div className="text-xs text-muted-foreground">Telegram ID</div><div className="break-all">{user.userId}</div></div>
          </div>
          {registered && !isGroup && <div className="flex items-start gap-3 text-sm">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div><div className="text-xs text-muted-foreground">Впервые записан</div><div>{registered}</div></div>
          </div>}
          {lastInteraction && <div className="flex items-start gap-3 text-sm">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div><div className="text-xs text-muted-foreground">Последняя активность</div><div>{lastInteraction}</div></div>
          </div>}
        </div>
        {children}
        {photoOpen && groupPhoto && <ImageLightbox src={user.avatarUrl!} alt="Фотография группы" onClose={() => setPhotoOpen(false)} />}
      </div>
    </aside>
  );
}
