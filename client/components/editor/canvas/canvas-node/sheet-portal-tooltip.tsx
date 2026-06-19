/**
 * @fileoverview Тултип со списком кросс-листовых связей портала
 *
 * Отображает компактный список конкретных связей портала вместо
 * нативного title=. Каждая строка — связь вида «sourceNodeId → targetNodeId»
 * с типом связи (connectionType). При большом количестве связей
 * включается вертикальный скролл.
 *
 * @module canvas-node/sheet-portal-tooltip
 */

import { CrossSheetLink } from '../canvas/utils/collect-cross-sheet-links';

/**
 * Свойства тултипа списка связей портала
 */
interface SheetPortalTooltipProps {
  /** Связи портала для отображения */
  links: CrossSheetLink[];
  /** Направление портала: исходящий или входящий */
  direction: 'outgoing' | 'incoming';
}

/** Человекочитаемые названия типов связей */
const CONNECTION_TYPE_LABELS: Record<string, string> = {
  'auto-transition': 'автопереход',
  'button-goto': 'кнопка',
  'condition-source': 'условие',
  'input-target': 'ввод',
  'trigger-next': 'триггер',
};

/**
 * Тултип со списком связей портала.
 * Для каждой связи показывает источник → цель и тип связи.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент тултипа
 */
export function SheetPortalTooltip({ links, direction }: SheetPortalTooltipProps) {
  return (
    <div className="max-w-[320px]">
      {/* Заголовок направления */}
      <div className="text-[11px] font-semibold mb-1 text-muted-foreground">
        {direction === 'outgoing' ? 'Исходящие связи' : 'Входящие связи'}
      </div>

      {/* Прокручиваемый список связей */}
      <ul className="space-y-0.5 max-h-[180px] overflow-y-auto pr-1">
        {links.map((link, i) => (
          <li key={`${link.sourceNodeId}-${link.targetNodeId}-${i}`} className="text-[11px] leading-tight">
            <span className="font-mono text-foreground">{link.sourceNodeId}</span>
            <span className="mx-1 text-muted-foreground">→</span>
            <span className="font-mono text-foreground">{link.targetNodeId}</span>
            <span className="ml-1.5 text-muted-foreground">
              ({CONNECTION_TYPE_LABELS[link.connectionType] ?? link.connectionType})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
