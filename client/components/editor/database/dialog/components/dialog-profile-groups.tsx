/** @fileoverview Сохранённые группы человека во всех ботах проекта без утверждения актуального членства. */
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Сохранённая связь человека с группой и конкретным ботом. */
interface ProfileGroup {
  /** Идентификатор группы Telegram. */ groupId: string;
  /** Сохранённое название группы. */ name: string;
  /** Тип группового чата. */ chatType: string;
  /** Идентификатор бота, наблюдавшего группу. */ tokenId: number | null;
  /** Сохранённое имя бота. */ botName: string | null;
  /** Публичный username бота. */ botUsername: string | null;
  /** Существует сохранённая запись участника. */ membershipKnown: boolean;
  /** Сохранённый статус участника. */ membershipStatus: string | null;
  /** Время сохранённой проверки участника. */ membershipCheckedAt: string | null;
  /** Время последнего сохранённого группового сообщения. */ lastActivityAt: string | null;
  /** Число сохранённых сообщений человека в группе. */ messageCount: number;
}

/** Контекст общей карточки человека. */
interface DialogProfileGroupsProps {
  /** Проект, ограничивающий сведения. */ projectId: number;
  /** Идентификатор человека Telegram. */ userId: string;
}

/**
 * Форматирует дату сохранённого свидетельства без запроса к Telegram.
 * @param value - Дата из базы
 * @returns Локальная дата либо отсутствие подписи
 */
function savedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Объясняет сохранённую запись членства, не выдавая её за текущую проверку.
 * @param group - Связь человека с группой
 * @returns Подпись происхождения сведений
 */
function membershipLabel(group: ProfileGroup): string {
  if (!group.membershipKnown) return 'Найден в истории сообщений';
  if (group.membershipStatus === 'left') return 'Сохранённый статус: вышел';
  if (group.membershipStatus === 'kicked') return 'Сохранённый статус: исключён';
  return 'Есть сохранённая запись участника';
}

/**
 * Показывает известные группы по всем ботам проекта и источник каждого сведения.
 * @param props - Проект и человек
 * @returns Секция профиля с состояниями загрузки, ошибки и отсутствия данных
 */
export function DialogProfileGroups({ projectId, userId }: DialogProfileGroupsProps) {
  const query = useQuery({
    queryKey: ['dialog-profile-groups', projectId, userId],
    enabled: projectId > 0 && /^[1-9]\d{0,19}$/.test(userId),
    staleTime: 30_000,
    queryFn: async ({ signal }): Promise<{ /** Сохранённые связи группа–бот. */ groups: ProfileGroup[] }> => {
      const response = await fetch(`/api/projects/${projectId}/users/${encodeURIComponent(userId)}/groups`, { credentials: 'include', signal });
      if (!response.ok) throw new Error('Не удалось загрузить группы');
      return response.json();
    },
  });
  return <section className="space-y-2" aria-label="Группы пользователя">
    <h3 className="flex items-center gap-1.5 text-sm font-medium"><Users className="h-4 w-4 text-muted-foreground" aria-hidden />Группы</h3>
    <p className="text-xs text-muted-foreground">По сохранённым данным всех ботов проекта. Текущее участие не проверялось.</p>
    {query.isLoading ? <p className="text-sm text-muted-foreground">Загрузка групп…</p>
      : query.isError ? <div role="alert" className="space-y-2 text-sm">
        <p className="text-destructive">Не удалось загрузить группы.</p>
        <Button variant="outline" size="sm" onClick={() => { void query.refetch(); }}>Повторить</Button>
      </div> : !query.data?.groups.length ? <p className="text-sm text-muted-foreground">Сохранённых сведений о группах нет.</p>
        : <ul className="divide-y rounded-lg border">
          {query.data.groups.map(group => <li key={`${group.groupId}:${group.tokenId ?? 'unknown'}`} className="space-y-1 p-3 text-xs">
            <p className="break-words text-sm font-medium">{group.name || group.groupId}</p>
            <p className="break-words text-muted-foreground">{group.botUsername ? `@${group.botUsername.replace(/^@/, '')}` : group.botName || 'Бот не указан'}{group.tokenId ? ` · #${group.tokenId}` : ''}</p>
            <p>{membershipLabel(group)}</p>
            {group.membershipKnown && savedDate(group.membershipCheckedAt) && <p className="text-muted-foreground">Запись участника: {savedDate(group.membershipCheckedAt)}</p>}
            {group.messageCount > 0 && <p className="text-muted-foreground">Сохранённых сообщений: {group.messageCount.toLocaleString('ru-RU')}{savedDate(group.lastActivityAt) ? ` · Последнее: ${savedDate(group.lastActivityAt)}` : ''}</p>}
          </li>)}
        </ul>}
  </section>;
}
