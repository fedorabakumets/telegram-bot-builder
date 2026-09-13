/**
 * @fileoverview Группа типов блоков на странице панели
 * @module components/admin/node-types/node-type-group
 */

import type { NodeTypeCatalogGroup } from './node-types-catalog';
import { NodeTypeRow } from './node-type-row';

/** Свойства группы */
export interface NodeTypeGroupProps {
  /** Группа каталога */
  group: NodeTypeCatalogGroup;
  /** Множество выключенных типов */
  disabledSet: Set<string>;
  /** Смена состояния типа */
  onToggle: (type: string, nextDisabled: boolean) => void;
}

/**
 * Карточка группы типов с переключателями
 * @param props - Свойства группы
 * @returns JSX элемент
 */
export function NodeTypeGroup({ group, disabledSet, onToggle }: NodeTypeGroupProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h2 className="text-sm font-semibold mb-2">{group.title}</h2>
      <div className="divide-y divide-border/50">
        {group.items.map((item) => (
          <NodeTypeRow
            key={item.type}
            item={item}
            disabled={disabledSet.has(item.type)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
