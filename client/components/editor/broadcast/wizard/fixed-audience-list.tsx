/** @fileoverview Проверка выбранных людей на первом шаге рассылки. */
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FixedBroadcastAudience } from '../utils/fixed-audience';

/**
 * Показывает получателей с поиском по имени, username и Telegram ID.
 * @param props - Выбранная аудитория и навигация редактора
 * @returns Проверяемый список людей вместо пустого шага
 */
export function FixedAudienceList({ audience, onNext, onCancel }: {
  /** Выбранные пользователи. */ audience: FixedBroadcastAudience;
  /** Переход к тексту. */ onNext: () => void;
  /** Закрытие редактора. */ onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);
  const users = useMemo(() => {
    const profiles = new Map(audience.users?.map(user => [user.userId, user]));
    const query = search.trim().toLocaleLowerCase();
    return audience.userIds.map(id => profiles.get(id) ?? { userId: id }).filter(user =>
      !query || `${user.firstName ?? ''} ${user.lastName ?? ''} ${user.userName ?? ''} ${user.userId}`.toLocaleLowerCase().includes(query));
  }, [audience, search]);
  return <div className="space-y-3">
    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-9 bg-background pl-9 text-sm" aria-label="Поиск среди получателей"
        placeholder="Имя, @username или ID" value={search} onChange={event => { setSearch(event.target.value); setLimit(100); }} />
    </div>
    <div className="max-h-[50vh] overflow-auto rounded-lg border border-border" aria-label="Список получателей рассылки">
      {users.slice(0, limit).map(user => <div key={user.userId} className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-0">
        <div className="min-w-0"><p className="truncate text-sm">{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || 'Пользователь'}</p>
          {user.userName && <p className="truncate text-xs text-muted-foreground">@{user.userName.replace(/^@/, '')}</p>}
        </div><span className="shrink-0 text-xs text-muted-foreground">ID: {user.userId}</span>
      </div>)}
      {!users.length && <p className="p-4 text-sm text-muted-foreground">В выбранной аудитории совпадений нет.</p>}
      {users.length > limit && <Button variant="ghost" className="h-9 w-full text-xs" onClick={() => setLimit(value => value + 100)}>Показать ещё</Button>}
    </div>
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">Показано: {Math.min(limit, users.length)} из {users.length}</span>
      <div className="flex gap-2"><Button variant="outline" onClick={onCancel}>Отмена</Button><Button onClick={onNext}>К сообщению</Button></div>
    </div>
  </div>;
}
