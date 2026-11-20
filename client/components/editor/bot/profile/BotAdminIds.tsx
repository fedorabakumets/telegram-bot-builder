/**
 * @fileoverview Компонент для редактирования списка ID администраторов бота
 * @module BotAdminIds
 */

import { useRef, useCallback } from 'react';
import { ShieldCheck, Plus, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminIds } from './use-admin-ids';

interface BotAdminIdsProps {
  /** ID проекта бота */
  projectId: number;
  /** Признак права редактировать список администраторов проекта. */
  canManage?: boolean;
  /** Колбэк для pending (если передан — кнопка "Сохранить" вызывает его вместо API) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Генерирует уникальный строковый ключ
 * @returns Случайная строка
 */
function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * Блок редактирования ID администраторов бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotAdminIds({ projectId, onPendingChange, canManage = true }: BotAdminIdsProps) {
  const { ids, setIds, isSaving, isSaved, save, hasDraft, isLoading, isReady, loadError, retry, saveError } =
    useAdminIds(projectId, canManage);
  const keysRef = useRef<string[]>([]);

  while (keysRef.current.length < ids.length) {
    keysRef.current.push(uid());
  }
  if (keysRef.current.length > ids.length) {
    keysRef.current.length = ids.length;
  }

  /** Обновить конкретный элемент списка */
  const update = useCallback(
    (i: number, val: string) => setIds(ids.map((id, idx) => (idx === i ? val : id))),
    [ids, setIds],
  );

  /** Удалить элемент; если остался один — оставить пустым */
  const remove = useCallback(
    (i: number) => {
      const next = ids.filter((_, idx) => idx !== i);
      keysRef.current.splice(i, 1);
      setIds(next.length ? next : ['']);
    },
    [ids, setIds],
  );

  /** Добавить новое пустое поле */
  const add = useCallback(() => {
    keysRef.current.push(uid());
    setIds([...ids, '']);
  }, [ids, setIds]);

  return (
    <div className="flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">Администраторы</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Telegram ID с правами администратора в ботах проекта</p>
        </div>
        {canManage && <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            onClick={add}
            disabled={!isReady || isSaving}
            aria-label="Добавить администратора"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={`h-7 w-7 ${isSaved ? 'text-emerald-500' : 'text-muted-foreground'}`}
            onClick={() => save(onPendingChange)}
            disabled={!isReady || !hasDraft || isSaving}
            aria-label="Сохранить список администраторов"
          >
            {isSaving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              : <Check className="h-3.5 w-3.5" aria-hidden />}
          </Button>
        </div>}
      </div>
      <div className="space-y-1.5 pl-10">
        {isLoading && <p role="status" className="text-xs text-muted-foreground">Загрузка администраторов…</p>}
        {loadError && (
          <div className="space-y-1">
            <p role="alert" className="text-xs text-destructive">Не удалось загрузить список администраторов.</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void retry()}>Повторить</Button>
          </div>
        )}
        {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}
        {isSaved && <p role="status" className="text-xs text-muted-foreground">Список сохранён.</p>}
        {isReady && !canManage && (
          <p className="break-words text-xs text-muted-foreground">{ids.filter(Boolean).join(', ') || 'Администраторы не заданы.'}</p>
        )}
        {isReady && canManage && ids.map((id, i) => (
          <div key={keysRef.current[i]} className="flex items-center gap-1.5">
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="Telegram ID"
              value={id}
              inputMode="numeric"
              disabled={isSaving}
              aria-label={`Telegram ID администратора ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(i)}
              disabled={isSaving}
              aria-label={`Удалить администратора ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
