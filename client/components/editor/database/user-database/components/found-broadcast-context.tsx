/** @fileoverview Общий выбор людей и фиксирование аудитории поиска перед созданием рассылки. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { NewBroadcastModal } from '@/components/editor/broadcast/wizard/new-broadcast-modal';
import { collectFoundAudience, type FoundAudienceScope } from '@/components/editor/broadcast/utils/collect-found-audience';
import type { FixedBroadcastAudience, FixedAudienceUser } from '@/components/editor/broadcast/utils/fixed-audience';
import { useDirectoryControls } from '../content/user-directory-controls';

/** Действия выбора и создания рассылки. */
interface FoundBroadcastControls {
  /** Доступен конкретный бот. */ enabled: boolean;
  /** Поиск или фильтры действительно сужают список. */ hasFilters: boolean;
  /** Открыты галочки выбора. */ selecting: boolean;
  /** Выбранные Telegram ID. */ selected: Set<string>;
  /** Собирается полный список. */ busy: boolean;
  /** Причина неудачного сбора. */ error: string;
  /** Переключает галочки. */ toggleSelection: () => void;
  /** Отмечает всю найденную выборку. */ selectAll: () => Promise<void>;
  /** Снимает выбор и отменяет сбор. */ cancel: () => void;
  /** Переключает одного человека. */ toggle: (id: string, name?: string | null, username?: string | null) => void;
  /** Открывает редактор для всех либо выбранных. */ open: (selectedOnly: boolean) => Promise<void>;
}
/** Контекст необязателен: обычные карточки не получают лишних контролов. */
const Context = createContext<FoundBroadcastControls | null>(null);
/** Возвращает выбор текущего списка. @returns Управление рассылкой либо отсутствие области. */
export function useFoundBroadcast() { return useContext(Context); }

/**
 * Изолирует выбор по проекту, боту, поиску и фильтрам; отправку сам не выполняет.
 * @param props - Область списка и вложенные карточки
 * @returns Список и редактор с неизменяемыми получателями
 */
export function FoundBroadcastProvider({ projectId, tokenId, search, audience, filterActive, filterPremium, children }: {
  /** Проект. */ projectId: number;
  /** Выбранный бот. */ tokenId?: number | null;
  /** Поисковая строка. */ search: string;
  /** Диалоги либо пользователи. */ audience: FoundAudienceScope['audience'];
  /** Прежний фильтр активности. */ filterActive?: boolean | null;
  /** Прежний фильтр Premium. */ filterPremium?: boolean | null;
  /** Карточки и действия. */ children: ReactNode;
}) {
  const controls = useDirectoryControls();
  const scope: FoundAudienceScope = { projectId, tokenId: tokenId ?? 0, audience, search,
    source: controls?.source ?? '', status: controls?.status ?? 'all',
    premium: controls?.premium && controls.premium !== 'all' ? controls.premium : filterPremium == null ? 'all' : String(filterPremium),
    advanced: { ...controls?.advanced, ...(tokenId ? { bots: undefined } : {}) }, filterActive };
  const key = JSON.stringify(scope);
  const hasFilters = Boolean(search.trim() || scope.source || scope.status !== 'all' || scope.premium !== 'all'
    || filterActive != null || Object.values(scope.advanced).some(value => value !== undefined && value !== ''));
  const [selection, setSelection] = useState({ key, selecting: false, ids: new Set<string>() });
  const current = selection.key === key ? selection : { key, selecting: false, ids: new Set<string>() };
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fixed, setFixed] = useState<(FixedBroadcastAudience & { /** Проект зафиксированного списка. */ projectId: number }) | null>(null);
  const controller = useRef<AbortController | null>(null);
  const profiles = useRef(new Map<string, FixedAudienceUser>());
  const latestKey = useRef(key); latestKey.current = key;
  useEffect(() => { controller.current?.abort(); profiles.current.clear(); setPendingKey(null); setError('');
    return () => controller.current?.abort(); }, [key]);
  /** Сбор завершает выбор прежде, чем пользователь вводит текст сообщения. */
  const run = async (mode: 'all' | 'selected' | 'selectAll') => {
    if (!tokenId || pendingKey) return;
    setError(''); setPendingKey(key);
    const request = new AbortController(); controller.current = request;
    try {
      const ids = mode === 'selected' ? [...current.ids] : await collectFoundAudience(scope, request.signal,
        users => { for (const user of users) profiles.current.set(user.userId, user); });
      if (!ids.length) throw new Error('Выберите хотя бы одного пользователя.');
      if (latestKey.current !== key || request.signal.aborted) return;
      if (mode === 'selectAll') setSelection({ key, selecting: true, ids: new Set(ids) });
      else setFixed({ projectId, tokenId, userIds: Object.freeze([...ids]),
        users: ids.map(id => profiles.current.get(id) ?? { userId: id }),
        label: mode === 'selected' ? 'Выбранные пользователи' : 'Найденные пользователи' });
    } catch (cause) {
      if (!request.signal.aborted && latestKey.current === key) setError(cause instanceof Error ? cause.message : 'Не удалось собрать получателей.');
    } finally { if (latestKey.current === key && controller.current === request) setPendingKey(null); }
  };
  return <Context.Provider value={{ enabled: !!tokenId, hasFilters, selecting: current.selecting, selected: current.ids,
    busy: pendingKey === key, error, open: selectedOnly => run(selectedOnly ? 'selected' : 'all'),
    selectAll: () => run('selectAll'),
    cancel: () => { controller.current?.abort(); controller.current = null; setPendingKey(null); setError(''); setSelection({ key, selecting: false, ids: new Set() }); },
    toggleSelection: () => setSelection({ key, selecting: !current.selecting, ids: new Set() }),
    toggle: (id, name, username) => { if (name || username) profiles.current.set(id, { userId: id, firstName: name, userName: username });
      const ids = new Set(current.ids); if (ids.has(id)) ids.delete(id); else ids.add(id);
      setSelection({ key, selecting: true, ids }); } }}>
    {children}
    {fixed && <NewBroadcastModal open projectId={fixed.projectId} tokenId={fixed.tokenId} fixedAudience={fixed} onClose={() => setFixed(null)} />}
  </Context.Provider>;
}
