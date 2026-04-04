/**
 * @fileoverview Поле текста кнопки
 *
 * Компонент ввода текста кнопки с кнопкой переменных, дублирования и удаления.
 */

import { Input } from '@/components/ui/input';
import { Button as UiButton } from '@/components/ui/button';
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
  /** Функция удаления кнопки */
  onDelete?: () => void;
  /** Функция дублирования кнопки */
  onDuplicate?: () => void;
}

/**
 * Компонент поля текста кнопки
 *
 * @param props - Пропсы компонента
 * @returns JSX элемент поля текста
 */
export function ButtonTextField({
  nodeId,
  button,
  textVariables,
  onButtonUpdate,
  onDelete,
  onDuplicate,
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
        {onDuplicate && (
          <UiButton
            size="sm"
            variant="ghost"
            onClick={onDuplicate}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-7 w-7 p-0 flex-shrink-0"
            title="Дублировать кнопку"
          >
            <i className="fas fa-copy w-4 h-4" />
          </UiButton>
        )}
        {onDelete && (
          <UiButton
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-7 w-7 p-0 flex-shrink-0"
            title="Удалить кнопку"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </UiButton>
        )}
      </div>
    </div>
  );
}
