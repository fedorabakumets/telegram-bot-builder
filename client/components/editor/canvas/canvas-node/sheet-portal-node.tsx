/**
 * @fileoverview Компонент визуального портала на другой лист
 *
 * Отображает виртуальную ноду-портал с пунктирной рамкой,
 * полупрозрачным фоном и иконкой листа. Одиночный клик —
 * переключение на целевой лист, двойной клик — переход на лист
 * с фокусом на целевой ноде. При наведении — тултип со списком связей.
 *
 * @module canvas-node/sheet-portal-node
 */

import { SheetPortal } from '../canvas/utils/collect-cross-sheet-links';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SheetPortalTooltip } from './sheet-portal-tooltip';
import { useSingleDoubleClick } from './use-single-double-click';

/**
 * Свойства компонента портала листа
 */
interface SheetPortalNodeProps {
  /** Данные портала (целевой лист + связи) */
  portal: SheetPortal;
  /** Позиция портала на канвасе */
  position: { x: number; y: number };
  /** Колбэк навигации на целевой лист (одиночный клик) */
  onNavigateSheet: (sheetId: string) => void;
  /** Колбэк навигации к целевой ноде с фокусом (двойной клик) */
  onNavigateNode?: (targetNodeId: string) => void;
}

/**
 * Визуальный компонент портала на другой лист.
 * Показывает название целевого листа, бейдж с количеством связей
 * и один порт слева для входящих линий.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент портала
 */
export function SheetPortalNode({ portal, position, onNavigateSheet, onNavigateNode }: SheetPortalNodeProps) {
  /** Целевая нода для фокуса при двойном клике (нода на другом листе) */
  const focusTargetNodeId = portal.links[0]?.targetNodeId;

  const { handleClick, handleDoubleClick } = useSingleDoubleClick(
    () => onNavigateSheet(portal.sheetId),
    () => {
      if (onNavigateNode && focusTargetNodeId) onNavigateNode(focusTargetNodeId);
      else onNavigateSheet(portal.sheetId);
    },
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute w-[576px] cursor-pointer select-none group"
            style={{ left: position.x, top: position.y }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            {/* Порт слева — точка входа для линий */}
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-purple-400 border-[3px] border-white dark:border-slate-800 shadow-md z-10" />

            {/* Тело портала */}
            <div className="relative border-[3px] border-dashed border-purple-400/60 dark:border-purple-500/50 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl px-8 py-7 backdrop-blur-sm transition-all duration-200 group-hover:border-purple-500 group-hover:bg-purple-100/70 dark:group-hover:bg-purple-900/50 group-hover:shadow-xl group-hover:shadow-purple-200/30 dark:group-hover:shadow-purple-900/30">
              {/* Иконка + название */}
              <div className="flex items-center gap-4">
                <span className="text-3xl flex-shrink-0">📋</span>
                <span className="text-xl font-semibold text-purple-700 dark:text-purple-300 truncate">
                  {portal.sheetName}
                </span>
              </div>

              {/* Бейдж с количеством связей */}
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-[36px] h-9 px-3 rounded-full bg-purple-200/80 dark:bg-purple-800/60 text-base font-bold text-purple-700 dark:text-purple-300">
                  {portal.links.length}
                </span>
                <span className="text-base text-purple-500/70 dark:text-purple-400/60">
                  {portal.links.length === 1 ? 'связь' : portal.links.length < 5 ? 'связи' : 'связей'}
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <SheetPortalTooltip links={portal.links} direction="outgoing" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
