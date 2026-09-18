/**
 * @fileoverview Поле «Группа (радио)» для selection-кнопок при multi-select
 * @module components/editor/properties/components/button-card/button-selection-group-field
 */

import { Input } from '@/components/ui/input';
import type { Button } from '@shared/schema';

/** Пропсы поля группы радиовыбора */
interface ButtonSelectionGroupFieldProps {
  /** ID узла */
  nodeId: string;
  /** Кнопка */
  button: Button;
  /** Обновление полей кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
}

/**
 * Ввод имени группы: одинаковые группы ведут себя как радиокнопки
 * @param props - Свойства компонента
 * @returns JSX поле или null
 */
export function ButtonSelectionGroupField({
  nodeId,
  button,
  onButtonUpdate,
}: ButtonSelectionGroupFieldProps) {
  if (button.action !== 'selection') return null;

  return (
    <>
      <div className="border-t border-border/20 my-3"></div>
      <div className="space-y-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Группа (радио)
        </span>
        <Input
          value={(button as Button & { selectionGroup?: string }).selectionGroup || ''}
          onChange={(e) =>
            onButtonUpdate(nodeId, button.id, {
              selectionGroup: e.target.value.trim() || undefined,
            } as Partial<Button>)
          }
          placeholder="currency"
          className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 rounded-lg"
        />
        <p className="text-[11px] text-muted-foreground leading-snug">
          Одинаковое имя — один выбор (🔘). Пусто — обычные галочки (✅).
        </p>
      </div>
    </>
  );
}
