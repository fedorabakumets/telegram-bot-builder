/**
 * @fileoverview Пикер переменных для поля customCallbackData кнопки.
 * Позволяет вставить {переменную} в callback_data inline-кнопки.
 * @module components/editor/properties/components/button-card/button-callback-variable-picker
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Pin } from 'lucide-react';
import type { Button as ButtonType } from '@shared/schema';
import type { ProjectVariable } from '../../utils/variables-utils';
import { SYSTEM_VARIABLES, getVariableIcon, getVariableColor } from '../variables/system-variables';

/** Пропсы компонента ButtonCallbackVariablePicker */
interface ButtonCallbackVariablePickerProps {
  /** ID узла */
  nodeId: string;
  /** Объект кнопки */
  button: ButtonType;
  /** Пользовательские переменные из проекта */
  textVariables: ProjectVariable[];
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<ButtonType>) => void;
}

/**
 * Компонент выбора переменной для вставки в customCallbackData.
 * Отображает системные и пользовательские переменные в компактном дропдауне.
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function ButtonCallbackVariablePicker({
  nodeId,
  button,
  textVariables,
  onButtonUpdate,
}: ButtonCallbackVariablePickerProps): JSX.Element {
  const allVariables = [...SYSTEM_VARIABLES, ...textVariables];

  /**
   * Вставляет переменную в конец строки customCallbackData.
   * @param varName - Имя переменной без фигурных скобок
   */
  const handleInsert = (varName: string): void => {
    const current = (button as any).customCallbackData ?? '';
    onButtonUpdate(nodeId, button.id, {
      customCallbackData: current + `{${varName}}`,
    } as any);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1 px-2 border-blue-300/40 dark:border-blue-700/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          title="Вставить переменную в callback_data"
        >
          <Pin className="h-3 w-3" />
          <span>Переменные</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-gradient-to-br from-blue-50/95 to-cyan-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-blue-200/50 dark:border-blue-800/50 shadow-xl"
      >
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Pin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <div className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              📌 Доступные переменные
            </div>
          </div>
          <div className="text-[10px] text-blue-600/70 dark:text-blue-400/60 mt-0.5">
            Вставить в callback_data
          </div>
        </div>
        <DropdownMenuSeparator className="bg-blue-200/30 dark:bg-blue-800/30" />
        <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
          {allVariables.length > 0 ? (
            allVariables.map((variable, index) => (
              <DropdownMenuItem
                key={`${variable.nodeId}-${variable.name}-${index}`}
                onClick={() => handleInsert(variable.name)}
                className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-white/60 dark:hover:bg-slate-700/50 transition-all"
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getVariableColor(variable.nodeType)} text-white`}
                  >
                    <i className={`fas ${getVariableIcon(variable.nodeType)} text-[9px]`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <code className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
                      {`{${variable.name}}`}
                    </code>
                    {variable.description && (
                      <div className="text-[10px] text-blue-500/70 dark:text-blue-400/50 truncate">
                        {variable.description}
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-[11px] text-blue-500 dark:text-blue-400">
              Нет доступных переменных
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
