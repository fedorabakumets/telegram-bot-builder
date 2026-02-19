/**
 * @fileoverview Компонент выпадающего списка переменных
 * Для вставки переменных в текст кнопок клавиатуры.
 * @module system-variables-dropdown
 */

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Button as ButtonType } from '@shared/schema';
import { SYSTEM_VARIABLES, getVariableIcon, getVariableColor, getVariableBadge } from './system-variables';

/** Пропсы компонента VariableDropdown */
interface VariableDropdownProps {
  /** ID текущего узла */
  nodeId: string;
  /** Кнопка для редактирования */
  button: ButtonType;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<ButtonType>) => void;
  /** Пользовательские переменные из проекта */
  textVariables: Array<{ name: string; nodeId: string; nodeType: string; description?: string; }>;
}

/**
 * Выпадающий список для вставки переменных в текст кнопки.
 * Отображает системные и пользовательские переменные с иконками и бейджами.
 * @param {VariableDropdownProps} props - Пропсы компонента
 * @returns {JSX.Element} Dropdown компонент с переменными
 */
export function VariableDropdown({ nodeId, button, onButtonUpdate, textVariables }: VariableDropdownProps): JSX.Element {
  const allVariables = [...SYSTEM_VARIABLES, ...textVariables];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-7 text-xs gap-1" title="Вставить переменную">
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Переменная</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 sm:w-80 md:w-96 bg-gradient-to-br from-purple-50/95 to-pink-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-purple-200/50 dark:border-purple-800/50 shadow-xl">
        <div className="px-3 py-3 sm:py-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/60 dark:bg-purple-900/50">
              <i className="fas fa-code text-xs sm:text-sm text-purple-600 dark:text-purple-300"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-100">Доступные переменные</div>
              <div className="text-xs text-purple-700/70 dark:text-purple-300/60 mt-0.5 leading-tight hidden sm:block">Нажмите на переменную, чтобы вставить</div>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-purple-200/30 dark:bg-purple-800/30 mx-0" />
        <div className="max-h-96 overflow-y-auto">
          {allVariables.length > 0 ? (
            <div className="p-2 space-y-2">
              {allVariables.map((variable, index) => (
                <DropdownMenuItem key={`${variable.nodeId}-${variable.name}-${index}`} onClick={() => { const currentText = button.text || ''; onButtonUpdate(nodeId, button.id, { text: currentText + `{${variable.name}}` }); }} className="cursor-pointer p-0 m-0 h-auto">
                  <div className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-150 border border-transparent hover:border-purple-300/40 dark:hover:border-purple-700/40 group flex items-start gap-2 sm:gap-3">
                    <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getVariableColor(variable.nodeType)} text-white group-hover:shadow-md transition-all`}>
                      <i className={`fas ${getVariableIcon(variable.nodeType)} text-xs sm:text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs sm:text-sm font-mono font-bold bg-white/60 dark:bg-slate-800/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-purple-700 dark:text-purple-300 group-hover:bg-white/80 dark:group-hover:bg-slate-700/80 transition-all">{`{${variable.name}}`}</code>
                        <Badge variant="secondary" className="text-xs h-5 text-xs font-semibold bg-white/70 dark:bg-slate-800/70 text-purple-700 dark:text-purple-300 border border-purple-300/30 dark:border-purple-700/30">{getVariableBadge(variable.nodeType)}</Badge>
                      </div>
                      {variable.description && (<div className="text-xs text-purple-600/80 dark:text-purple-300/60 mt-1 leading-tight">{variable.description}</div>)}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="px-3 sm:px-4 py-4 sm:py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2"><i className="fas fa-inbox text-purple-400 dark:text-purple-500"></i></div>
              <div className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Нет переменных</div>
              <div className="text-xs text-purple-600/70 dark:text-purple-400/60 leading-relaxed">Добавьте узлы для получения переменных</div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
