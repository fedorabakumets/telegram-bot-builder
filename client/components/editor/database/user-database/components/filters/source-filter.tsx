/** @fileoverview Серверный фильтр по всем источникам проекта, независимый от текущей страницы. */
import { UNSAVED_USER_SOURCE } from '@shared/user-source-fallback';
import { sourceColor } from '@shared/source-color';
import { useQuery } from '@tanstack/react-query';
import { GitBranch } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useDirectoryControls } from '../../content/user-directory-controls';
/**
 * Показывает список источников, загруженный в области выбранного проекта и бота.
 * @param props - Проект и выбранный бот.
 * @returns Фильтр источников.
 */
export function SourceFilter({ projectId, tokenId }: {
  /** Идентификатор проекта. */ projectId: number;
  /** Выбранный бот либо все боты. */ tokenId: number | null;
}) {
  const controls = useDirectoryControls();
  const counts = controls?.result?.sourceCounts;
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;
  /** Счётчик относится ко всему результату, а не только к загруженной странице. */
  function label(text: string, count?: number) {
    return `${text} · ${count === undefined ? '—' : count.toLocaleString('ru-RU')}`;
  }
  const { data, isPending, isError } = useQuery<{ /** Доступные подписи источников. */ sources: string[] }>({
    queryKey: ['user-source-options', projectId, tokenId, controls?.audience ?? 'users'],
    queryFn: async () => {
      const response = await fetch(buildUsersApiUrl(`/api/projects/${projectId}/users`, tokenId,
        { limit: '1', ...(controls?.audience === 'dialogs' ? { dialogUserFilters: 'true', dialogKind: 'users' } : { privateContactsOnly: 'true' }) }), { credentials: 'include' });
      if (!response.ok) throw new Error('Не удалось загрузить источники');
      return response.json();
    }, staleTime: 60_000,
  });
  /** Крупные источники идут первыми; одинаковые количества упорядочены по названию. */
  const sources = [...new Set([...(data?.sources ?? []), ...Object.keys(counts ?? {})])].filter(source => source !== 'Нет данных' && (source !== UNSAVED_USER_SOURCE || (counts?.[source] ?? 0) > 0))
    .sort((left, right) => (counts?.[right] ?? 0) - (counts?.[left] ?? 0) || left.localeCompare(right, 'ru'));
  return <Select value={controls?.source || '__all__'} onValueChange={value => controls?.setSource(value === '__all__' ? '' : value)}>
    <SelectTrigger aria-label="Источник пользователей" title={controls?.source || 'Все источники'} className="h-10 w-full min-w-0 text-sm [&>span]:truncate">
      <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
        <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <SelectValue placeholder="Все источники" />
      </div>
    </SelectTrigger>
    <SelectContent className="users-portal">
      <SelectItem value="__all__">{label('Все источники', total)}</SelectItem>
      {isPending && <SelectItem value="__loading__" disabled>Загрузка источников…</SelectItem>}
      {isError && <SelectItem value="__error__" disabled>Источники недоступны</SelectItem>}
      {sources.map(source =>
        <SelectItem key={source} value={source} className="users-source-option" title={source}><span style={{ color: sourceColor(source) }}>{label(source, counts ? counts[source] ?? 0 : undefined)}</span></SelectItem>)}
    </SelectContent>
  </Select>;
}
