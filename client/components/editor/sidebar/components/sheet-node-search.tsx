/**
 * @fileoverview Компонент поля поиска узлов в листе
 * @module components/editor/sidebar/components/sheet-node-search
 */

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Пропсы компонента SheetNodeSearch
 */
interface SheetNodeSearchProps {
  /** Текущее значение поиска */
  value: string;
  /** Обработчик изменения значения */
  onChange: (value: string) => void;
}

/**
 * Компонент поля поиска узлов внутри раскрытого листа аккордеона
 * @param props - Свойства компонента SheetNodeSearchProps
 * @returns JSX элемент поля поиска
 */
export function SheetNodeSearch({ value, onChange }: SheetNodeSearchProps) {
  return (
    <div
      className="relative mb-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Поиск узлов..."
        className="h-6 text-xs pl-6 pr-2 py-0"
      />
    </div>
  );
}
