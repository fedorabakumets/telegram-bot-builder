/**
 * @fileoverview Компонент ВХОДЯЩЕГО портала с другого листа
 *
 * Отображает виртуальную ноду-портал с пунктирной рамкой,
 * бирюзовым оформлением и стрелкой ←. Порт расположен СПРАВА,
 * линия выходит к целевой ноде на текущем листе. Одиночный клик —
 * переключение на исходный лист, двойной клик — переход на исходный
 * лист с фокусом на ноде-источнике. При наведении — тултип со связями.
 *
 * @module canvas-node/incoming-sheet-portal-node
 */

import { SheetPortal } from '../canvas/utils/collect-cross-sheet-links';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SheetPortalTooltip } from './sheet-portal-tooltip';
import { useSingleDoubleClick } from './use-single-double-click';

/**
 * Свойства компонента входящего портала
 */
interface IncomingSheetPortalNodeProps {
  /** Данные портала (исходный лист + связи) */
  portal: SheetPortal;
  /** Позиция портала на канвасе */
  position: { x: number; y: number };
  /** Колбэк навигации на исходный лист (одиночный клик) */
  onNavigateSheet: (sheetId: string) => void;
  /** Колбэк навигации к ноде-источнику с фокусом (двойной клик) */
  onNavigateNode?: (sourceNodeId: string) => void;
}

/**
 * Визуальный компонент входящего портала с другого листа.
 * Показывает название исходного листа, бейдж с количеством связей
 * и порт справа для линий к целевым нодам.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент входящего портала
 */
export function IncomingSheetPortalNode({ portal, position, onNavigateSheet, onNavigateNode }: IncomingSheetPortalNodeProps) {
  /** Нода-источник на другом листе для фокуса при двойном клике */
  const focusSourceNodeId = portal.links[0]?.sourceNodeId;

  const { handleClick, handleDoubleClick } = useSingleDoubleClick(
    () => onNavigateSheet(portal.sheetId),
    () => {
      if (onNavigateNode && focusSourceNodeId) onNavigateNode(focusSourceNodeId);
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
            {/* Порт справа — точка выхода для линий к целевым нодам */}
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-teal-400 border-[3px] border-white dark:border-slate-800 shadow-md z-10" />

            {/* Тело портала */}
            <div className="relative border-[3px] border-dashed border-teal-400/60 dark:border-teal-500/50 bg-teal-50/60 dark:bg-teal-950/40 rounded-2xl px-8 py-7 backdrop-blur-sm transition-all duration-200 group-hover:border-teal-500 group-hover:bg-teal-100/70 dark:group-hover:bg-teal-900/50 group-hover:shadow-xl group-hover:shadow-teal-200/30 dark:group-hover:shadow-teal-900/30">
              {/* Иконка + стрелка + название */}
              <div className="flex items-center gap-4">
                <span className="text-3xl flex-shrink-0">📥</span>
                <span className="text-xl font-semibold text-teal-700 dark:text-teal-300 truncate">
                  ← {portal.sheetName}
                </span>
              </div>

              {/* Бейдж с количеством связей */}
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-[36px] h-9 px-3 rounded-full bg-teal-200/80 dark:bg-teal-800/60 text-base font-bold text-teal-700 dark:text-teal-300">
                  {portal.links.length}
                </span>
                <span className="text-base text-teal-500/70 dark:text-teal-400/60">
                  {portal.links.length === 1 ? 'связь' : portal.links.length < 5 ? 'связи' : 'связей'}
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <SheetPortalTooltip links={portal.links} direction="incoming" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
