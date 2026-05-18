/**
 * @fileoverview Секция Row для узла bot_table (операции insert, upsert)
 * @module components/editor/properties/components/configuration/bot-table-row-section
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Пропсы секции Row */
interface BotTableRowSectionProps {
  /** Объект строки: ключ — колонка, значение — данные */
  row: Record<string, string>;
  /** Колбэк при изменении */
  onChange: (row: Record<string, string>) => void;
}

/**
 * Секция данных строки для вставки/upsert
 * @param props - Пропсы компонента
 * @returns JSX-элемент секции
 */
export function BotTableRowSection({ row, onChange }: BotTableRowSectionProps) {
  const entries = Object.entries(row);

  /** Добавить новое поле */
  const handleAdd = () => {
    const newKey = `field_${entries.length + 1}`;
    onChange({ ...row, [newKey]: '' });
  };

  /** Обновить ключ (переименовать колонку) */
  const handleKeyChange = (oldKey: string, newKey: string) => {
    const updated: Record<string, string> = {};
    for (const [k, v] of entries) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange(updated);
  };

  /** Обновить значение */
  const handleValueChange = (key: string, value: string) => {
    onChange({ ...row, [key]: value });
  };

  /** Удалить поле */
  const handleRemove = (key: string) => {
    const updated = { ...row };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Данные строки
      </Label>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-1.5">
          <Input
            value={key}
            onChange={(e) => handleKeyChange(key, e.target.value)}
            placeholder="колонка"
            className="text-xs h-7 flex-1 bg-white/60 dark:bg-slate-950/60"
          />
          <span className="text-xs text-muted-foreground">=</span>
          <Input
            value={value}
            onChange={(e) => handleValueChange(key, e.target.value)}
            placeholder="{user_id}"
            className="text-xs h-7 flex-1 bg-white/60 dark:bg-slate-950/60"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-600"
            onClick={() => handleRemove(key)}
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
