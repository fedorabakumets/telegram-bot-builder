/**
 * @fileoverview Поле текста кнопки
 * 
 * Компонент ввода текста кнопки с кнопкой переменных.
 */

import { Input } from '@/components/ui/input';
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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
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
