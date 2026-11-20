/** @fileoverview Сбор всех найденных пользователей, включая незагруженные страницы списка. */
import type { AdvancedUserFilters } from '@shared/user-advanced-filters';
import type { FixedAudienceUser } from './fixed-audience';

/** Точная область поиска, зафиксированная перед сбором. */
export interface FoundAudienceScope {
  /** Проект списка. */ projectId: number;
  /** Выбранный бот. */ tokenId: number;
  /** Область личных диалогов либо таблица пользователей. */ audience: 'dialogs' | 'users';
  /** Поисковый текст. */ search: string;
  /** Источник. */ source: string;
  /** Статус. */ status: string;
  /** Premium. */ premium: string;
  /** Дополнительные фильтры. */ advanced: AdvancedUserFilters;
  /** Прежний фильтр активности таблицы. */ filterActive?: boolean | null;
}

/**
 * Последовательно собирает полную выборку, не превращая пустой результат в отправку всем.
 * @param scope - Фильтры и выбранный бот
 * @param signal - Отмена при смене поиска или закрытии списка
 * @param onUsers - Имена и реквизиты для просмотра получателей
 * @returns Уникальные Telegram ID найденных людей
 */
export async function collectFoundAudience(scope: FoundAudienceScope, signal?: AbortSignal, onUsers?: (users: FixedAudienceUser[]) => void): Promise<string[]> {
  const ids = new Set<string>();
  const profiles = new Map<string, FixedAudienceUser>();
  let offset = 0;
  let expectedTotal: number | undefined;
  for (;;) {
    const params = new URLSearchParams({ tokenId: String(scope.tokenId), limit: '200', offset: String(offset),
      search: scope.search, source: scope.source, status: scope.status, premium: scope.premium,
      sortBy: 'lastInteraction', sortDir: 'desc', filters: JSON.stringify(scope.advanced), audienceSnapshot: 'true' });
    if (scope.audience === 'dialogs') { params.set('dialogKind', 'users'); params.set('dialogUserFilters', 'true'); }
    else params.set('privateContactsOnly', 'true');
    if (scope.filterActive != null) params.set('filterActive', String(scope.filterActive));
    const response = await fetch(`/api/projects/${scope.projectId}/users?${params}`, { credentials: 'include', signal });
    if (!response.ok) {
      const error = await response.json().catch(() => null) as { /** Понятная причина отказа. */ message?: string } | null;
      throw new Error(error?.message ?? 'Не удалось собрать получателей. Попробуйте ещё раз.');
    }
    const page = await response.json() as {
      /** Пользователи текущей страницы. */ users: Array<FixedAudienceUser & { /** Групповой чат. */ isGroup?: boolean }>;
      /** Всего найдено. */ total: number;
      /** Есть следующая страница. */ hasMore: boolean;
    };
    if (!Array.isArray(page.users) || !Number.isSafeInteger(page.total) || page.total < 0) throw new Error('Некорректный список получателей.');
    if (page.total > 10000) throw new Error('Найдено больше 10 000 пользователей. Уточните фильтры для этой рассылки.');
    if (expectedTotal !== undefined && expectedTotal !== page.total) throw new Error('Результаты поиска изменились. Повторите сбор получателей.');
    expectedTotal = page.total;
    for (const user of page.users) {
      const id = String(user.userId);
      if (user.isGroup || !/^[1-9]\d{0,19}$/.test(id)) throw new Error('В списке найден неподходящий получатель. Уточните фильтры.');
      ids.add(id);
      profiles.set(id, { userId: id, firstName: typeof user.firstName === 'string' ? user.firstName : null,
        lastName: typeof user.lastName === 'string' ? user.lastName : null, userName: typeof user.userName === 'string' ? user.userName : null });
    }
    offset += page.users.length;
    if (!page.hasMore) break;
    if (!page.users.length || offset >= 10000) throw new Error('Не удалось полностью собрать получателей. Уточните фильтры.');
  }
  if (!ids.size) throw new Error('По этим условиям пользователей не найдено.');
  onUsers?.([...profiles.values()]);
  return [...ids];
}
