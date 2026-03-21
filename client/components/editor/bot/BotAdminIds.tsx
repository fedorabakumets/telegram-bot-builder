/**
 * @fileoverview Компонент для редактирования списка ID администраторов бота
 *
 * Динамический список полей: одно поле — один Telegram ID.
 * Поддерживает добавление, удаление и сохранение.
 *
 * @module BotAdminIds
 */

import { ShieldCheck, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminIds } from './use-admin-ids';

interface BotAdminIdsProps {
  /** ID проекта бота */
  projectId: number;
}

/**
 * Блок редактирования ID администраторов бота (динамический список)
 */
export function BotAdminIds({ projectId }: BotAdminIdsProps) {
  const { ids, setIds, isSaving, save } = useAdminIds(projectId);

  /** Обновить конкретный элемент списка */
  const update = (i: number, val: string) =>
    setIds(ids.map((id, idx) => (idx === i ? val : id)));

  /** Удалить элемент; если остался один — оставить пустым */
  const remove = (i: number) => {
    const next = ids.filter((_, idx) => idx !== i);
    setIds(next.length ? next : ['']);
  };

  /** Добавить новое пустое поле */
  const add = () => setIds([...ids, '']);

  return (
    <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border transition-all bg-purple-500/8 border-purple-500/30 dark:bg-purple-500/10 dark:border-purple-500/40 col-span-full">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300 flex-1">
          Администраторы
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
          onClick={add}
          title="Добавить администратора"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
          onClick={save}
          disabled={isSaving}
          title="Сохранить"
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
      </div>

      {ids.map((id, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            className="h-7 text-xs flex-1 bg-transparent border-purple-500/30 focus-visible:ring-purple-500/40 text-purple-700 dark:text-purple-300 placeholder:text-purple-400/60"
            placeholder="Telegram ID администратора"
            value={id}
            onChange={(e) => update(i, e.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0 text-purple-400 hover:text-purple-600 hover:bg-purple-500/20"
            onClick={() => remove(i)}
            title="Удалить"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
