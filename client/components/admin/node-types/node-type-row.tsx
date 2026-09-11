/**
 * @fileoverview Строка переключателя одного типа блока
 * @module components/admin/node-types/node-type-row
 */

import { Switch } from '@/components/ui/switch';
import { isCoreNodeType } from '@shared/disabled-node-types';
import type { NodeTypeCatalogItem } from './node-types-catalog';

/** Свойства строки типа */
export interface NodeTypeRowProps {
  /** Элемент каталога */
  item: NodeTypeCatalogItem;
  /** Тип сейчас выключен */
  disabled: boolean;
  /** Смена состояния: true = выключить */
  onToggle: (type: string, nextDisabled: boolean) => void;
}

/**
 * Одна строка: название типа и переключатель
 * @param props - Свойства строки
 * @returns JSX элемент
 */
export function NodeTypeRow({ item, disabled, onToggle }: NodeTypeRowProps) {
  const isCore = isCoreNodeType(item.type);

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{item.label}</div>
        <div className="text-xs text-muted-foreground font-mono truncate">
          {item.type}
          {isCore ? ' · ядро' : ''}
        </div>
      </div>
      <Switch
        checked={!disabled && !isCore}
        disabled={isCore}
        onCheckedChange={(checked) => onToggle(item.type, !checked)}
        aria-label={
          isCore
            ? `${item.label}: нельзя выключить`
            : `${item.label}: ${disabled ? 'выключен' : 'включён'}`
        }
      />
    </div>
  );
}
