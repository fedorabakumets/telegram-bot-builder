/**
 * @fileoverview Компонент отображения истории действий
 *
 * Содержит Popover со списком действий пользователя
 * и возможностью выбора действий для отмены.
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Action } from './canvas';

interface ActionHistoryProps {
  actionHistory: Action[];
  handleMouseDownAction: (index: number) => void;
  handleMouseOverAction: (index: number) => void;
  toggleActionSelection: (actionId: string) => void;
  selectedActionsForUndo: Set<string>;
  handleUndoSelected: () => void;
}

/** Иконка и цвет для каждого типа действия */
function getActionIcon(type: Action['type']): { icon: string; colorClass: string; bgClass: string } {
  switch (type) {
    case 'add':        return { icon: 'fa-plus',         colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15' };
    case 'delete':     return { icon: 'fa-trash',        colorClass: 'text-red-500 dark:text-red-400',         bgClass: 'bg-red-500/10 dark:bg-red-500/15' };
    case 'move':       return { icon: 'fa-arrows-alt',   colorClass: 'text-blue-500 dark:text-blue-400',       bgClass: 'bg-blue-500/10 dark:bg-blue-500/15' };
    case 'update':     return { icon: 'fa-pen',          colorClass: 'text-violet-500 dark:text-violet-400',   bgClass: 'bg-violet-500/10 dark:bg-violet-500/15' };
    case 'connect':    return { icon: 'fa-link',         colorClass: 'text-cyan-500 dark:text-cyan-400',       bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15' };
    case 'disconnect': return { icon: 'fa-unlink',       colorClass: 'text-orange-500 dark:text-orange-400',   bgClass: 'bg-orange-500/10 dark:bg-orange-500/15' };
    case 'duplicate':  return { icon: 'fa-clone',        colorClass: 'text-amber-500 dark:text-amber-400',     bgClass: 'bg-amber-500/10 dark:bg-amber-500/15' };
    default:           return { icon: 'fa-circle-dot',   colorClass: 'text-slate-400 dark:text-slate-500',     bgClass: 'bg-slate-500/10 dark:bg-slate-500/15' };
  }
}

/** Обрезает технический id вида "(abc123...)" из описания */
function cleanDescription(description: string): string {
  return description.replace(/\s*\([A-Za-z0-9_-]{10,}\)/g, '').trim();
}

/** Форматирует время: сегодня → "21:23", иначе → "19 мар" */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  return isToday
    ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function ActionHistory({
  actionHistory,
  handleMouseDownAction,
  handleMouseOverAction,
  toggleActionSelection,
  selectedActionsForUndo,
  handleUndoSelected,
}: ActionHistoryProps) {
  const allSelected =
    actionHistory.length > 0 && actionHistory.every(a => selectedActionsForUndo.has(a.id));

  function handleSelectAll() {
    if (allSelected) {
      actionHistory.forEach(a => {
        if (selectedActionsForUndo.has(a.id)) toggleActionSelection(a.id);
      });
    } else {
      actionHistory.forEach(a => {
        if (!selectedActionsForUndo.has(a.id)) toggleActionSelection(a.id);
      });
    }
  }

  const selectedCount = selectedActionsForUndo.size;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center"
          title="История действий"
        >
          <i className="fas fa-clock-rotate-left text-slate-600 dark:text-slate-400 text-sm group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        className="w-80 p-0 overflow-hidden"
        style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <i className="fas fa-clock-rotate-left text-slate-400 dark:text-slate-500 text-xs" />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">История</span>
            {actionHistory.length > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                {actionHistory.length}
              </span>
            )}
          </div>
          {actionHistory.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              {allSelected ? 'Снять всё' : 'Выбрать всё'}
            </button>
          )}
        </div>

        {/* Список */}
        <div className="overflow-y-auto flex-1 py-1">
          {actionHistory.length > 0 ? (
            actionHistory.map((action, index) => {
              const isSelected = selectedActionsForUndo.has(action.id);
              const { icon, colorClass, bgClass } = getActionIcon(action.type);
              return (
                <div
                  key={action.id}
                  onPointerDown={(e) => { e.preventDefault(); handleMouseDownAction(index); }}
                  onPointerEnter={() => handleMouseOverAction(index)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none
                    transition-colors duration-100
                    ${isSelected
                      ? 'bg-violet-50 dark:bg-violet-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }
                  `}
                >
                  {/* Чекбокс */}
                  <div className={`
                    flex-shrink-0 w-4 h-4 rounded border transition-colors
                    flex items-center justify-center
                    ${isSelected
                      ? 'bg-violet-500 border-violet-500'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }
                  `}>
                    {isSelected && <i className="fas fa-check text-white" style={{ fontSize: '9px' }} />}
                  </div>

                  {/* Иконка типа */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${bgClass}`}>
                    <i className={`fas ${icon} ${colorClass}`} style={{ fontSize: '10px' }} />
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-200 truncate leading-tight">
                      {cleanDescription(action.description)}
                    </p>
                  </div>

                  {/* Время */}
                  <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                    {formatTime(action.timestamp)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <i className="fas fa-clock-rotate-left text-slate-300 dark:text-slate-600 text-2xl" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Нет действий в истории</p>
            </div>
          )}
        </div>

        {/* Футер с кнопкой отмены */}
        {selectedCount > 0 && (
          <div className="flex-shrink-0 px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
            <button
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={handleUndoSelected}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-medium transition-colors"
            >
              <i className="fas fa-rotate-left" />
              Отменить {selectedCount} {selectedCount === 1 ? 'действие' : selectedCount < 5 ? 'действия' : 'действий'}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
