/**
 * @fileoverview Поле текста кнопки
 * 
 * Компонент ввода текста кнопки с кнопкой переменных.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableDropdown } from '../variables/system-variables-dropdown';
import type { Button } from '@shared/schema';
import type { ProjectVariable } from '../../utils/variables-utils';

/** Пропсы поля текста кнопки */
interface ButtonTextFieldProps {
  /** ID узла */
  nodeId: string;
  /** Объект кнопки */
  button: Button;
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
}

/**
 * Компонент поля текста кнопки
 * 
 * @param {ButtonTextFieldProps} props - Пропсы компонента
 * @returns {JSX.Element} Поле текста кнопки
 */
export function ButtonTextField({
  nodeId,
  button,
  textVariables,
  onButtonUpdate
}: ButtonTextFieldProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-purple-50/40 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/40 dark:border-purple-800/30 hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/50 dark:bg-purple-900/40 group-hover:bg-purple-300/50 dark:group-hover:bg-purple-800/50 transition-all">
          <i className="fas fa-keyboard text-xs sm:text-sm text-purple-600 dark:text-purple-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 cursor-pointer block">
            Текст кнопки
          </Label>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-purple-300/40 dark:border-purple-700/40 hover:border-purple-400/60 dark:hover:border-purple-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus-within:border-purple-500 dark:focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/30 dark:focus-within:ring-purple-600/30 transition-all duration-200">
        <Input
          value={button.text}
          onChange={(e) => onButtonUpdate(nodeId, button.id, { text: e.target.value })}
          className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-purple-900 dark:text-purple-50 placeholder:text-purple-500/50 dark:placeholder:text-purple-400/50 p-0"
          placeholder="Введите текст кнопки"
        />
        <VariableDropdown
          nodeId={nodeId}
          button={button}
          onButtonUpdate={onButtonUpdate}
          textVariables={textVariables}
        />
      </div>
    </div>
  );
}
