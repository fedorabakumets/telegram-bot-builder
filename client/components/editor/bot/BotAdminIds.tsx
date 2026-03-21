/**
 * @fileoverview Компонент для редактирования списка ID администраторов бота
 *
 * Отображает поле ввода для ADMIN_IDS и кнопку сохранения.
 * Стиль аналогичен BotDatabaseToggle — градиентный блок с иконкой.
 *
 * @module BotAdminIds
 */

import { ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminIds } from './use-admin-ids';

interface BotAdminIdsProps {
  /** ID проекта бота */
  projectId: number;
}

/**
 * Блок редактирования ID администраторов бота
 */
export function BotAdminIds({ projectId }: BotAdminIdsProps) {
  const { value, setValue, isSaving, save } = useAdminIds(projectId);

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all bg-purple-500/8 border-purple-500/30 dark:bg-purple-500/10 dark:border-purple-500/40 col-span-full">
      <ShieldCheck className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
      <Input
        className="h-7 text-xs flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-0 text-purple-700 dark:text-purple-300 placeholder:text-purple-400/60"
        placeholder="ID администраторов через запятую: 123456, 789012"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
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
  );
}
