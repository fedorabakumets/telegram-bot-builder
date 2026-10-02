/**
 * @fileoverview Мини-бар несохранённых изменений для панели переменных окружения
 * Компактная полоса с кнопками: Сбросить, Сохранить, Перезапустить
 * @module components/editor/bot/card/BotEnvStagingBar
 */

import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Play, Save } from 'lucide-react';

/** Свойства мини-бара изменений */
interface BotEnvStagingBarProps {
  /** Количество несохранённых изменений */
  changesCount: number;
  /** Идёт ли сохранение */
  isSaving: boolean;
  /** Сбросить все изменения */
  onDiscard: () => void;
  /** Сохранить изменения */
  onSave: () => void;
  /** Сохранить и перезапустить бота */
  onSaveAndRestart: () => void;
}

/**
 * Мини-бар несохранённых изменений переменных окружения
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvStagingBar({
  changesCount, isSaving, onDiscard, onSave, onSaveAndRestart,
}: BotEnvStagingBarProps) {
  /** Склонение слова «изменение» */
  const label = changesCount === 1 ? 'изменение' : 'изменений';

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1.5 px-1 text-xs font-medium text-amber-800 dark:text-amber-200">
        <Pencil className="h-3 w-3" />
        {changesCount} {label}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={onDiscard} disabled={isSaving}
          className="h-7 rounded-lg px-2 text-xs text-muted-foreground">
          Сбросить
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}
          className="h-7 gap-1 rounded-lg bg-violet-600 px-2 text-xs text-white hover:bg-violet-700">
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Сохранить
        </Button>
        <Button size="sm" onClick={onSaveAndRestart} disabled={isSaving}
          className="h-7 gap-1 rounded-lg bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700">
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Перезапустить
        </Button>
      </div>
    </div>
  );
}
