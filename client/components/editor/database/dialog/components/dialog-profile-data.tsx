/** @fileoverview Загрузка сохранённых сведений профиля диалога выбранного бота. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { UserBotData } from '@/types/bot';
import { DialogProfile } from './dialog-profile';

/** Сохранённые сведения группы. */
interface SavedGroup {
  /** Telegram ID группы. */
  groupId: string;
  /** Имя группы. */
  name?: string | null;
  /** Фотография группы. */
  avatarUrl?: string | null;
  /** Публичная ссылка группы, если она известна. */
  url?: string | null;
  /** Описание группы. */
  description?: string | null;
  /** Количество участников, если оно известно. */
  memberCount?: number | null;
}

/** Свойства профиля с загрузкой сохранённых данных. */
interface DialogProfileDataProps {
  /** Исходные данные диалога или автора. */
  user: UserBotData;
  /** Проект. */
  projectId: number;
  /** Выбранный бот. */
  tokenId?: number | null;
  /** Имя исходной группы для автора сообщения. */
  memberGroup?: string | null;
  /** Закрытие профиля. */
  onClose: () => void;
}

/**
 * Показывает данные профиля в рамках выбранного проекта и бота.
 * @param props - Контекст профиля
 * @returns Карточка сохранённых сведений
 */
export function DialogProfileData({ user, projectId, tokenId, memberGroup, onClose }: DialogProfileDataProps) {
  const isGroup = !!user.isGroup || String(user.userId).startsWith('-');
  const query = useQuery({
    queryKey: ['dialog-profile', projectId, tokenId, String(user.userId), isGroup],
    enabled: !!projectId && !!tokenId && !!user.userId,
    queryFn: async ({ signal }): Promise<UserBotData | SavedGroup | null> => {
      const url = isGroup ? `/api/projects/${projectId}/groups?tokenId=${tokenId}` : `/api/projects/${projectId}/users/${encodeURIComponent(String(user.userId))}?tokenId=${tokenId}`;
      const response = await fetch(url, { credentials: 'include', signal });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Не удалось загрузить профиль');
      const data = await response.json();
      return isGroup ? (Array.isArray(data) ? data.find((item: SavedGroup) => String(item.groupId) === String(user.userId)) ?? null : null) : data;
    },
    staleTime: 30000,
  });
  const group = isGroup ? query.data as SavedGroup | null | undefined : null;
  /** Обновляем сведения группы по запросу пользователя через выбранного бота. */
  const sync = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/groups/${encodeURIComponent(String(user.userId))}/sync?tokenId=${tokenId}`, {
        method: 'POST', credentials: 'include', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Не удалось получить данные группы из Telegram');
      return response.json();
    },
    onSuccess: () => query.refetch(),
  });
  const person = !isGroup ? query.data as UserBotData | null | undefined : null;
  /** Извлекаем только публичное имя, не считая приватное приглашение username. */
  const groupUsername = group?.url?.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]{5,32})\/?(?:\?.*)?$/i)?.[1];
  const enriched = isGroup ? { ...user, firstName: group?.name ?? user.firstName, avatarUrl: group?.avatarUrl ?? user.avatarUrl, userName: groupUsername ?? user.userName } : { ...user, ...person, userName: person?.userName ?? user.userName };
  return (
    <DialogProfile user={enriched} projectId={projectId} tokenId={tokenId} onClose={onClose}>
      <div className="space-y-4 border-t px-5 py-4 text-sm">
        {isGroup && tokenId && <div>
          <button type="button" disabled={sync.isPending} onClick={() => sync.mutate()}
            className="rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50">
            {sync.isPending ? 'Обновление…' : 'Обновить данные из Telegram'}
          </button>
          {sync.isError && <p role="alert" className="mt-2 text-destructive">Не удалось получить данные. Проверьте доступ бота к группе.</p>}
          {sync.isSuccess && !groupUsername && !query.isFetching && <p className="mt-2 text-muted-foreground">Telegram не вернул публичный username группы.</p>}
        </div>}
        {memberGroup && <p className="text-muted-foreground">Автор сообщения в группе «{memberGroup}». Данные показаны для выбранного бота.</p>}
        {query.isLoading && <p className="text-muted-foreground">Загрузка сведений…</p>}
        {query.isError && <p role="alert" className="text-destructive">Не удалось загрузить дополнительные сведения.</p>}
        {isGroup && group?.description && <div><h3 className="mb-1 text-xs text-muted-foreground">Описание</h3><p className="whitespace-pre-wrap break-words">{group.description}</p></div>}
        {isGroup && group?.memberCount != null && <div><h3 className="mb-1 text-xs text-muted-foreground">Участников</h3><p>{group.memberCount.toLocaleString('ru-RU')}</p></div>}
        {isGroup && group?.memberCount == null && !query.isLoading && <p className="text-muted-foreground">Количество участников неизвестно.</p>}
        {!isGroup && memberGroup && !person && !query.isLoading && !query.isError && <p className="text-muted-foreground">Имя взято из сообщения. Других сохранённых данных у этого бота нет.</p>}
      </div>
    </DialogProfile>
  );
}
