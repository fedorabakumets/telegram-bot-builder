/**
 * @fileoverview Поле описания команды
 * 
 * Компонент для ввода описания команды бота.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Пропсы компонента описания команды */
interface DescriptionFieldProps {
  /** ID выбранного узла */
  selectedNodeId: string;
  /** Текущее значение описания */
  descriptionValue: string;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент поля описания команды
 * 
 * @param {DescriptionFieldProps} props - Пропсы компонента
 * @returns {JSX.Element} Поле описания
 */
export function DescriptionField({
  selectedNodeId,
  descriptionValue,
  onNodeUpdate
}: DescriptionFieldProps) {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
        <i className="fas fa-align-left text-blue-600 dark:text-blue-400 text-xs sm:text-sm"></i>
        Описание
      </Label>
      <Input
        value={descriptionValue}
        onChange={(e) => onNodeUpdate(selectedNodeId, { description: e.target.value })}
        placeholder="Например: Начать работу с ботом"
        className="mt-1.5 sm:mt-2 text-xs sm:text-sm border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200/50"
        data-testid="input-description"
      />
      <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
        <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Используется для меню команд в @BotFather
        </p>
      </div>
    </div>
  );
}
