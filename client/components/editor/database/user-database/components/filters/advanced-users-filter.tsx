/** @fileoverview Раскрываемые дополнительные фильтры прямо под основной строкой без отдельного окна. */
import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { advancedUserFiltersSchema, type AdvancedUserFilters } from '@shared/user-advanced-filters';
import { useDirectoryControls } from '../../content/user-directory-controls';
import { AdvancedFilterFields } from './advanced-filter-fields';
import './advanced-users-filter.css';
/**
 * Считает активные группы, объединяя границы одного диапазона.
 * @param value - Применённые ограничения.
 * @param singleBot - Выбран один бот.
 * @param hideLanguage - Язык управляется отдельным основным фильтром.
 * @returns Количество работающих групп.
 */
function countGroups(value: AdvancedUserFilters, singleBot: boolean, hideLanguage = false): number {
  return [value.lastActiveFrom || value.lastActiveTo || value.activity, value.registeredFrom || value.registeredTo, value.variableName,
    value.messagesMin ?? value.messagesMax, value.clicksMin ?? value.clicksMax,
    !singleBot && value.bots, !hideLanguage && value.language, value.contactOrigin].filter(value => value !== undefined && value !== false && value !== '').length;
}
/**
 * Раскрывает поля в потоке страницы и автоматически применяет корректные условия.
 * @param props - Область текущего бота.
 * @returns Кнопка раскрытия и встроенные дополнительные фильтры.
 */
export function AdvancedUsersFilter({ tokenId, projectId = 0, search = '', hideLanguage = false }: {
  /** Язык уже расположен среди основных фильтров. */ hideLanguage?: boolean;
  /** Выбранный бот или все боты. */ tokenId: number | null;
  /** Проект для справочника переменных. */ projectId?: number;
  /** Поиск пользователей для точных количеств условий. */ search?: string;
}) {
  const controls = useDirectoryControls();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AdvancedUserFilters>(() => controls?.advanced ?? {});
  const [error, setError] = useState('');
  const setAdvanced = controls?.setAdvanced;
  const applied = JSON.stringify(controls?.advanced ?? {});
  const lastApplied = useRef(applied);
  const lastPublished = useRef<string | null>(null);
  const externalChange = applied !== lastApplied.current && applied !== lastPublished.current;
  /** Внешний язык или общий сброс обновляют черновик; собственное применение не стирает новый ввод. */
  useEffect(() => {
    if (applied === lastApplied.current) return;
    const ownUpdate = applied === lastPublished.current;
    const previous = JSON.parse(lastApplied.current) as Record<string, unknown>;
    const next = JSON.parse(applied) as Record<string, unknown>;
    lastApplied.current = applied;
    lastPublished.current = null;
    if (!ownUpdate) {
      /** Внешний язык меняет только свои поля, сохраняя ещё не применённый ввод диапазона. */
      setDraft(current => {
        if (!Object.keys(next).length) return {};
        const merged: Record<string, unknown> = { ...current };
        for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
          if (previous[key] !== next[key]) {
            if (next[key] === undefined) delete merged[key]; else merged[key] = next[key];
          }
        }
        return merged as AdvancedUserFilters;
      });
      setError('');
    }
  }, [applied]);
  /** Пауза объединяет ввод границ, а неполное условие равенства ждёт выбора значения. */
  useEffect(() => {
    if (!setAdvanced || externalChange) return;
    if (draft.variableMode === 'equals' && draft.variableValue === undefined) { setError(''); return; }
    const parsed = advancedUserFiltersSchema.safeParse({ ...draft, ...(tokenId !== null ? { bots: undefined } : {}) });
    if (!parsed.success) {
      setError(parsed.error.issues.find(issue => issue.code === 'custom')?.message
        ?? 'Проверьте даты, код языка и целые неотрицательные количества.'); return;
    }
    setError('');
    if (JSON.stringify(parsed.data) === applied) return;
    const timer = setTimeout(() => {
      lastPublished.current = JSON.stringify(parsed.data);
      setAdvanced(parsed.data);
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, tokenId, applied, setAdvanced, externalChange]);
  if (!controls) return null;
  const count = countGroups(controls.advanced, tokenId !== null, hideLanguage);
  /** Сброс сразу обновляет список и видимые поля. */
  function reset() {
    const cleared = hideLanguage && controls!.advanced.language ? { language: controls!.advanced.language } : {};
    controls!.setAdvanced(cleared); setDraft(cleared); setError('');
  }
  return <div className="users-advanced-bar flex flex-wrap items-center gap-3">
    <Button type="button" variant="outline" aria-expanded={open} aria-controls="users-advanced-fields" onClick={() => {
      setOpen(!open);
    }}>
      {open ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
      {open ? 'Скрыть фильтры' : 'Ещё фильтры'}{count > 0 ? ` · ${count}` : ''}
    </Button>
    {(count > 0 || countGroups(draft, tokenId !== null, hideLanguage) > 0) && <Button type="button" variant="ghost" onClick={reset}>Сбросить дополнительные</Button>}
    {open && <div id="users-advanced-fields" className="users-advanced-inline w-full space-y-4">
      <AdvancedFilterFields projectId={projectId} tokenId={tokenId} search={search} hideLanguage={hideLanguage} value={draft}
        onChange={value => { setDraft(value); setError(''); }} singleBot={tokenId !== null} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>}
  </div>;
}
