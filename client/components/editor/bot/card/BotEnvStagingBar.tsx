/**
 * @fileoverview Мини-бар несохранённых изменений для панели переменных окружения
 * Компактная полоса с кнопками: Сбросить, Сохранить, Перезапустить
 * @module components/editor/bot/card/BotEnvStagingBar
 */

import { Button } from '@/components/ui/button';

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
    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
      <span className="text-xs text-slate-600 dark:text-slate-300 px-1.5 whitespace-nowrap">
        <i className="fas fa-pencil text-violet-500 dark:text-violet-400 mr-1.5" />
        {changesCount} {label}
      </span>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onDiscard} disabled={isSaving}
        className="h-6 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
        Сбросить
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving}
        className="h-6 px-2 text-xs bg-violet-600 hover:bg-violet-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />Сохранение…</>
          : <>💾 Сохранить</>}
      </Button>
      <Button size="sm" onClick={onSaveAndRestart} disabled={isSaving}
        className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />…</>
          : <>▶ Перезапустить</>}
      </Button>
    </div>
  );
}
