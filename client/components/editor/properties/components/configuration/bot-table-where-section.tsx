/**
 * @fileoverview Секция WHERE для узла bot_table
 * @module components/editor/properties/components/configuration/bot-table-where-section
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Условие WHERE */
interface WhereCondition {
  /** Имя колонки */
  column: string;
  /** Значение для сравнения */
  value: string;
}

/** Пропсы секции WHERE */
interface BotTableWhereSectionProps {
  /** Массив условий */
  where: WhereCondition[];
  /** Колбэк при изменении */
  onChange: (where: WhereCondition[]) => void;
}

/**
 * Секция условий WHERE для фильтрации строк таблицы
 * @param props - Пропсы компонента
 * @returns JSX-элемент секции
 */
export function BotTableWhereSection({ where, onChange }: BotTableWhereSectionProps) {
  /** Добавить новое условие */
  const handleAdd = () => {
    onChange([...where, { column: '', value: '' }]);
  };

  /** Обновить условие по индексу */
  const handleUpdate = (index: number, field: keyof WhereCondition, val: string) => {
    const updated = [...where];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  /** Удалить условие по индексу */
  const handleRemove = (index: number) => {
    onChange(where.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Условие (WHERE)
      </Label>
      {where.map((cond, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={cond.column}
            onChange={(e) => handleUpdate(i, 'column', e.target.value)}
            placeholder="колонка"
            className="text-xs h-7 flex-1 bg-white/60 dark:bg-slate-950/60"
          />
          <span className="text-xs text-muted-foreground">=</span>
          <Input
            value={cond.value}
            onChange={(e) => handleUpdate(i, 'value', e.target.value)}
            placeholder="{user_id}"
            className="text-xs h-7 flex-1 bg-white/60 dark:bg-slate-950/60"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-600"
            onClick={() => handleRemove(i)}
          >
            <i className="fas fa-times text-xs" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7 w-full"
        onClick={handleAdd}
      >
        <i className="fas fa-plus mr-1 text-xs" /> Добавить условие
      </Button>
    </div>
  );
}
