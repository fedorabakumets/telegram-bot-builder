/**
 * @fileoverview Интерактивный значок для выбора типа кнопки.
 * 
 * Позволяет пользователю изменять тип кнопки (normal, option, complete)
 * через выпадающее меню, встроенное в значок.
 */

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { Button } from '@shared/schema';
import { buttonTypeConfig } from './button-type-config';

/** Пропсы для интерактивного значка типа кнопки */
interface ButtonTypeBadgeProps {
  /** ID узла, к которому принадлежит кнопка. */
  nodeId: string;
  /** Объект кнопки для обновления. */
  button: Button;
  /** Функция для обновления данных кнопки. */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
}

/**
 * Интерактивный значок для выбора типа кнопки.
 * 
 * @param {ButtonTypeBadgeProps} props - Пропсы компонента.
 * @returns {JSX.Element} Интерактивный значок в виде выпадающего списка.
 */
export function ButtonTypeBadge({ nodeId, button, onButtonUpdate }: ButtonTypeBadgeProps) {
  const currentType = button.buttonType || 'normal';
  const { styles, icon, label } = buttonTypeConfig[currentType];

  const handleValueChange = (value: 'normal' | 'option' | 'complete') => {
    const updates: Partial<Button> = { buttonType: value };
    if (value === 'option') {
      updates.action = 'selection';
      updates.target = '';
    } else {
      updates.action = 'goto';
      updates.target = '';
    }
    onButtonUpdate(nodeId, button.id, updates);
  };

  return (
    <Select value={currentType} onValueChange={handleValueChange}>
      <SelectTrigger className={`mt-1.5 inline-flex cursor-pointer items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-xs font-medium transition-all duration-200 focus:ring-0 focus:ring-offset-0 border-none ${styles}`}>
        {icon}
        <span>{label}</span>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/95 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
        {Object.entries(buttonTypeConfig).map(([type, { label, icon }]) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              {icon}
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
