/**
 * @fileoverview Диалог создания проекта на экране «нет проектов»
 * @module components/editor/no-projects/NoProjectsCreateDialog
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TypewriterText } from '@/components/editor/auth/TypewriterText';
import { cn } from '@/utils/utils';

/** Подсказка проводника в модалке */
const HINT =
  'Придумайте короткое имя — так проект будет проще найти в списке.';

/** Пропсы диалога создания */
export interface NoProjectsCreateDialogProps {
  /** Открыт ли диалог */
  open: boolean;
  /** Смена состояния открытости */
  onOpenChange: (open: boolean) => void;
  /** Текущее имя проекта */
  projectName: string;
  /** Обновление имени */
  onProjectNameChange: (value: string) => void;
  /** Подтверждение создания */
  onSubmit: () => void;
  /** Идёт ли создание */
  isPending: boolean;
}

/**
 * Модалка ввода названия нового проекта (в стиле онбординга)
 * @param props - Свойства
 * @returns JSX элемент
 */
export function NoProjectsCreateDialog({
  open,
  onOpenChange,
  projectName,
  onProjectNameChange,
  onSubmit,
  isPending,
}: NoProjectsCreateDialogProps) {
  const [hintDone, setHintDone] = useState(false);

  useEffect(() => {
    if (open) setHintDone(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b border-primary/15 bg-primary/5 px-4 py-3 sm:px-6 sm:py-4">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-lg">Новый проект</DialogTitle>
            {open ? (
              <p className="text-sm text-foreground/85 leading-relaxed min-h-[2.5rem] font-normal">
                <TypewriterText
                  key="create-hint"
                  text={HINT}
                  delayMs={120}
                  speedMs={24}
                  onDone={() => setHintDone(true)}
                />
              </p>
            ) : null}
          </DialogHeader>
        </div>

        <div
          className={cn(
            'space-y-4 px-4 py-4 sm:px-6 sm:py-5 transition-all duration-500',
            hintDone
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          <Input
            placeholder="Название проекта"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && projectName.trim() && onSubmit()}
            autoFocus={hintDone}
            className="h-10 rounded-xl border-blue-500/35 ring-1 ring-blue-500/20 focus-visible:ring-blue-500/35"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Отмена
            </Button>
            <Button disabled={!projectName.trim() || isPending || !hintDone} onClick={onSubmit}>
              {isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
