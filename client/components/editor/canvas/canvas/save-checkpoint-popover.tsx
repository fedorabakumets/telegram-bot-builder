/**
 * @fileoverview Поповер сохранения проекта с необязательной заметкой
 *
 * Маленькая кнопка-стрелочка рядом с кнопкой «Сохранить». По клику открывает
 * поповер с необязательным полем заметки. Если заметка указана — снимок проекта
 * становится постоянным ручным чекпоинтом (kind='manual') и не удаляется при
 * очистке истории.
 *
 * @module editor/canvas/canvas/save-checkpoint-popover
 */

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Пропсы поповера сохранения с заметкой */
export interface SaveCheckpointPopoverProps {
  /** Колбэк сохранения с непустой заметкой (создаёт ручной чекпоинт) */
  onSaveWithNote: (note: string) => void;
  /** Флаг процесса сохранения */
  isSaving?: boolean;
  /** Размер триггера: 'toolbar' — крупная кнопка тулбара, 'bar' — компактная для плашки */
  size?: 'toolbar' | 'bar';
}

/** Классы триггер-кнопки крупного варианта (тулбар холста) */
const TOOLBAR_TRIGGER_CLASS = 'flex-shrink-0 p-0 h-9 w-6 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center';

/** Классы триггер-кнопки компактного варианта (плашка несохранённых изменений) */
const BAR_TRIGGER_CLASS = 'flex-shrink-0 p-0 h-7 w-5 rounded-md bg-violet-600 hover:bg-violet-700 text-white transition-colors duration-200 flex items-center justify-center';

/**
 * Кнопка-стрелочка с поповером для сохранения с заметкой
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки с поповером
 */
export function SaveCheckpointPopover({ onSaveWithNote, isSaving, size = 'toolbar' }: SaveCheckpointPopoverProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  /** Сохранить с заметкой: вызвать колбэк, очистить поле и закрыть поповер */
  const handleSubmit = () => {
    const trimmed = note.trim();
    if (!trimmed || isSaving) return;
    onSaveWithNote(trimmed);
    setNote('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={size === 'bar' ? BAR_TRIGGER_CLASS : TOOLBAR_TRIGGER_CLASS}
          title="Сохранить с заметкой"
        >
          <i
            className={size === 'bar'
              ? 'fas fa-chevron-down text-[10px]'
              : 'fas fa-chevron-down text-slate-600 dark:text-slate-400 text-xs group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors'}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" className="w-72 p-3">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Сохранить с заметкой</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Заметка к версии (необязательно)…"
            autoFocus
          />
          <Button onClick={handleSubmit} disabled={!note.trim() || isSaving} size="sm">
            {isSaving ? 'Сохранение…' : 'Сохранить чекпоинт'}
          </Button>
          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            С заметкой снимок станет постоянным чекпоинтом и не удалится при очистке истории.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
