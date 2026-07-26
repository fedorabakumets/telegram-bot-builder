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
export function BotAdminIds({ projectId, onPendingChange }: BotAdminIdsProps) {
  const { ids, setIds, isSaving, isSaved, save } = useAdminIds(projectId);
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
          <p className="mt-0.5 text-xs text-muted-foreground">Telegram ID с правами админа</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            onClick={add}
            aria-label="Добавить администратора"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`h-7 w-7 ${isSaved ? 'text-emerald-500' : 'text-muted-foreground'}`}
            onClick={() => {
              if (onPendingChange) {
                onPendingChange('ADMIN_IDS', ids.filter(Boolean).join(','));
              } else {
                save();
              }
            }}
            disabled={isSaving}
            aria-label="Сохранить список администраторов"
          >
            {isSaving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              : <Check className="h-3.5 w-3.5" aria-hidden />}
          </Button>
        </div>
      </div>
      <div className="space-y-1.5 pl-10">
        {ids.map((id, i) => (
          <div key={keysRef.current[i]} className="flex items-center gap-1.5">
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="Telegram ID"
              value={id}
              aria-label={`Telegram ID администратора ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(i)}
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
