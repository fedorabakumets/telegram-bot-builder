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
        <div className="relative group">
          <i className="fas fa-info-circle text-blue-500 dark:text-blue-400 text-xs sm:text-sm cursor-help"></i>
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 text-xs bg-blue-900 dark:bg-slate-800 text-blue-100 dark:text-slate-200 rounded-lg shadow-lg z-50">
            Используется для меню команд в @BotFather
            <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-900 dark:border-t-slate-800"></div>
          </div>
        </div>
      </Label>
      <Input
        value={descriptionValue}
        onChange={(e) => onNodeUpdate(selectedNodeId, { description: e.target.value })}
        placeholder="Например: Начать работу с ботом"
        className="text-sm border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200/50"
        data-testid="input-description"
      />
    </div>
  );
}
