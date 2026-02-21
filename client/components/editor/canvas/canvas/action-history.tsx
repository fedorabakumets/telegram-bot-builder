/**
 * @fileoverview Компонент отображения истории действий
 * 
 * Содержит Popover со списком действий пользователя
 * и возможностью выбора действий для отмены.
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Action } from './canvas';

/**
 * Свойства компонента истории действий
 */
interface ActionHistoryProps {
  /** Массив истории действий */
  actionHistory: Action[];
  /** Колбэк начала выделения действия */
  handleMouseDownAction: (index: number) => void;
  /** Колбэк выделения диапазона действий */
  handleMouseOverAction: (index: number) => void;
  /** Колбэк переключения выбора действия */
  toggleActionSelection: (actionId: string) => void;
  /** Выбранные действия для отмены */
  selectedActionsForUndo: Set<string>;
  /** Колбэк отмены выбранных действий */
  handleUndoSelected: () => void;
}

/**
 * Получение иконки для типа действия
 * 
 * @param type - Тип действия
 * @returns Название иконки и классы цвета
 */
function getActionIcon(type: Action['type']): { icon: string; colorClass: string } {
  switch (type) {
    case 'add': return { icon: 'plus', colorClass: 'text-green-600 dark:text-green-400' };
    case 'delete': return { icon: 'trash', colorClass: 'text-red-600 dark:text-red-400' };
    case 'move': return { icon: 'arrows', colorClass: 'text-blue-600 dark:text-blue-400' };
    case 'update': return { icon: 'edit', colorClass: 'text-purple-600 dark:text-purple-400' };
    case 'connect': return { icon: 'link', colorClass: 'text-cyan-600 dark:text-cyan-400' };
    case 'disconnect': return { icon: 'unlink', colorClass: 'text-orange-600 dark:text-orange-400' };
    case 'duplicate': return { icon: 'copy', colorClass: 'text-yellow-600 dark:text-yellow-400' };
    default: return { icon: 'circle', colorClass: 'text-gray-600 dark:text-gray-400' };
  }
}

/**
 * Компонент отображения истории действий
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент Popover с историей действий
 */
export function ActionHistory({
  actionHistory,
  handleMouseDownAction,
  handleMouseOverAction,
  toggleActionSelection,
  selectedActionsForUndo,
  handleUndoSelected
}: ActionHistoryProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center"
          title="История действий"
        >
          <i className="fas fa-history text-slate-600 dark:text-slate-400 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-96 p-3 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm">История действий</h4>
            {selectedActionsForUndo.size > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                {selectedActionsForUndo.size} выбрано
              </span>
            )}
          </div>
          {actionHistory.length > 0 ? (
            <div className="space-y-2">
              <div className="space-y-1 text-xs max-h-64 overflow-y-auto select-none">
                {actionHistory.map((action, index) => {
                  const isSelected = selectedActionsForUndo.has(action.id);
                  const { icon, colorClass } = getActionIcon(action.type);
                  return (
                    <div
                      key={action.id}
                      onMouseDown={() => handleMouseDownAction(index)}
                      onMouseOver={() => handleMouseOverAction(index)}
                      onClick={() => toggleActionSelection(action.id)}
                      className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${isSelected
                        ? 'bg-blue-500/30 dark:bg-blue-900/40 border border-blue-400/50 dark:border-blue-600/50'
                        : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        className="mt-0.5 cursor-pointer"
                      />
                      <i className={`fas fa-${icon} ${colorClass}`} />
                      <div className="flex-1">
                        <p className="text-slate-600 dark:text-slate-300">{action.description}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                          {new Date(action.timestamp).toLocaleTimeString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedActionsForUndo.size > 0 && (
                <button
                  onClick={handleUndoSelected}
                  className="w-full mt-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-400/50 dark:border-red-600/50 rounded text-xs font-medium transition-colors"
                >
                  <i className="fas fa-undo mr-1" />
                  Отменить {selectedActionsForUndo.size} {selectedActionsForUndo.size === 1 ? 'действие' : 'действий'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 dark:text-slate-500 text-xs opacity-70">Нет действий в истории</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
