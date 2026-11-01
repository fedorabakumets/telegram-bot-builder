/**
 * @fileoverview Футер spreadsheet — добавление строк с указанием количества
 * @module editor/tables/components/add-rows-footer
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Пропсы футера */
interface AddRowsFooterProps {
  /** Обработчик добавления строк */
  onAddRows: (count: number) => void;
}

/**
 * Выравнивает кнопку добавления и количество строк в одной адаптивной строке.
 * @param props - Пропсы компонента
 * @returns JSX элемент футера
 */
export function AddRowsFooter({ onAddRows }: AddRowsFooterProps) {
  /** Количество строк для добавления */
  const [count, setCount] = useState('1');

  /** Обработчик добавления */
  const handleAdd = () => {
    const num = Math.max(1, parseInt(count, 10) || 1);
    onAddRows(num);
  };

  return (
    <div className="tables-add-rows flex shrink-0 items-center gap-2 px-3 py-2 border-t border-border/50 bg-muted/10">
      <Button
        size="sm"
        variant="outline"
        className="h-10 min-w-0 text-xs gap-1.5"
        aria-label="Добавить строки"
        onClick={handleAdd}
      >
        <Plus className="h-3 w-3" />
        <span>Добавить<span className="tables-add-rows-label"> строк</span></span>
      </Button>
      <Input
        type="number"
        aria-label="Количество добавляемых строк"
        min={1}
        value={count}
        onChange={(e) => setCount(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        className="h-10 w-16 shrink-0 text-xs"
      />
    </div>
  );
}
