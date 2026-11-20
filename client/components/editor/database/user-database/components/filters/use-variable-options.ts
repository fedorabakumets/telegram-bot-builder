/** @fileoverview Загрузка переменных и численности условий в области остальных фильтров аудитории. */
import { useEffect, useState } from 'react';
import { advancedUserFiltersSchema, type AdvancedUserFilters } from '@shared/user-advanced-filters';
import type { UserVariableOptions } from '@shared/user-variable-options';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useDirectoryControls } from '../../content/user-directory-controls';
/**
 * Запрашивает только названия и количества без значений переменных пользователей.
 * @param props - Проект, бот, поиск, черновик и состояние меню.
 * @returns Список переменных и состояние загрузки.
 */
export function useVariableOptions({ projectId, tokenId, search, value, enabled, valueSearch = '' }: {
  /** Поиск по списку значений выбранной переменной. */ valueSearch?: string;
  /** Проект пользователей. */ projectId: number;
  /** Бот или весь проект. */ tokenId: number | null;
  /** Текущий текст поиска. */ search: string;
  /** Черновик дополнительных ограничений. */ value: AdvancedUserFilters;
  /** Меню переменной открыто. */ enabled: boolean;
}) {
  const controls = useDirectoryControls();
  const [data, setData] = useState<UserVariableOptions>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const parsed = advancedUserFiltersSchema.safeParse({ ...value, variableName: undefined, variableMode: undefined,
    variableValue: undefined, ...(tokenId !== null ? { bots: undefined } : {}) });
  const url = parsed.success ? buildUsersApiUrl(`/api/projects/${projectId}/users`, tokenId, {
    limit: '1', ...(controls?.audience === 'dialogs' ? { dialogUserFilters: 'true', dialogKind: 'users' } : { privateContactsOnly: 'true' }), variableOptions: 'true', variableEquals: value.variableValue ?? '',
    variableName: value.variableName ?? '', variableValueSearch: valueSearch,
    filters: JSON.stringify(parsed.data), search, source: controls?.source ?? '',
    status: controls?.status ?? 'all', premium: controls?.premium ?? 'all',
  }) : '';
  useEffect(() => {
    if (!enabled || !projectId) return;
    setData(undefined); setError(''); setLoading(true);
    if (!url) { setLoading(false); setError('Проверьте остальные диапазоны фильтров'); return; }
    const controller = new AbortController();
    /** Небольшая задержка не отправляет запрос на каждый символ точного значения. */
    const timer = setTimeout(() => {
      fetch(url, { credentials: 'include', signal: controller.signal }).then(async response => {
        if (!response.ok) throw new Error('Не удалось загрузить переменные');
        const result = await response.json();
        if (!controller.signal.aborted) setData(result);
      }).catch(() => { if (!controller.signal.aborted) setError('Не удалось загрузить переменные'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [url, enabled, projectId]);
  return { data, loading, error };
}
