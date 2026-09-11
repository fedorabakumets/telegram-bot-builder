/**
 * @fileoverview Плавающая кнопка сохранения списка типов
 * @module components/admin/node-types/node-types-save-fab
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/** Свойства плавающей кнопки */
export interface NodeTypesSaveFabProps {
  /** Есть несохранённые изменения */
  dirty: boolean;
  /** Идёт сохранение */
  pending: boolean;
  /** Нажатие «Сохранить» */
  onSave: () => void;
}

/**
 * Одна кнопка поверх страницы — всегда на виду при прокрутке
 * @param props - Свойства кнопки
 * @returns JSX элемент
 */
export function NodeTypesSaveFab({ dirty, pending, onSave }: NodeTypesSaveFabProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-30 md:bottom-8 md:right-8">
      <Button
        onClick={onSave}
        disabled={pending || !dirty}
        className={cn(
          'pointer-events-auto shadow-lg transition-all',
          dirty
            ? 'scale-100 opacity-100'
            : 'opacity-70',
        )}
      >
        {pending ? 'Сохранение…' : dirty ? 'Сохранить' : 'Сохранено'}
      </Button>
    </div>
  );
}
