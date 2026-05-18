/**
 * @fileoverview Секция Updates для узла bot_table (операция update)
 * @module components/editor/properties/components/configuration/bot-table-updates-section
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Элемент обновления */
interface UpdateEntry {
  /** Имя колонки */
  column: string;
  /** Операция: set, increment, decrement, min, max */
  op: string;
  /** Значение */
  value: string;
}

/** Пропсы секции Updates */
interface BotTableUpdatesSectionProps {
  /** Массив обновлений */
  updates: UpdateEntry[];
  /** Колбэк при изменении */
  onChange: (updates: UpdateEntry[]) => void;
}

/** Метки операций обновления */
const OP_LABELS: Record<string, string> = {
  set: '=',
  increment: '+',
  decrement: '−',
  min: 'min',
  max: 'max',
};

/**
 * Секция обновлений полей таблицы
 * @param props - Пропсы компонента
 * @returns JSX-элемент секции
 */
export function BotTableUpdatesSection({ updates, onChange }: BotTableUpdatesSectionProps) {
  /** Добавить новое обновление */
  const handleAdd = () => {
    onChange([...updates, { column: '', op: 'set', value: '' }]);
  };

  /** Обновить элемент по индексу */
  const handleUpdate = (index: number, field: keyof UpdateEntry, val: string) => {
    const updated = [...updates];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  /** Удалить элемент по индексу */
  const handleRemove = (index: number) => {
    onChange(updates.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Изменения
      </Label>
      {updates.map((entry, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={entry.column}
            onChange={(e) => handleUpdate(i, 'column', e.target.value)}
            placeholder="колонка"
            className="text-xs h-7 flex-1 bg-white/60 dark:bg-slate-950/60"
          />
          <Select
            value={entry.op}
            onValueChange={(val) => handleUpdate(i, 'op', val)}
          >
            <SelectTrigger className="text-xs h-7 w-14 bg-white/60 dark:bg-slate-950/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OP_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={entry.value}
            onChange={(e) => handleUpdate(i, 'value', e.target.value)}
            placeholder="значение"
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
        <i className="fas fa-plus mr-1 text-xs" /> Добавить поле
      </Button>
    </div>
  );
}
