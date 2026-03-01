/**
 * @fileoverview Компонент выбора действия для кнопки ответа
 * 
 * Позволяет выбрать действие:
 * - Перейти к экрану
 * - Выполнить команду
 * - Открыть ссылку
 * - Выбор опции
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACTION_OPTIONS, ResponseAction } from './response-action-config';

/** Пропсы компонента ActionSelector */
interface ActionSelectorProps {
  /** Текущее действие */
  action: ResponseAction;
  /** Индекс опции */
  index: number;
  /** Функция обновления действия */
  onActionChange: (index: number, action: ResponseAction) => void;
}

/**
 * Компонент выбора действия для кнопки
 * 
 * @param {ActionSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор действия
 */
export function ActionSelector({ action, index, onActionChange }: ActionSelectorProps) {
  return (
    <div>
      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">
        Действие кнопки
      </Label>
      <Select
        value={action || 'goto'}
        onValueChange={(value: ResponseAction) => onActionChange(index, value)}
      >
        <SelectTrigger className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <i className={`fas ${opt.icon} text-xs ${opt.iconColor}`}></i>
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
