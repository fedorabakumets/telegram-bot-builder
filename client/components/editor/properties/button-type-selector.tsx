/**
 * @fileoverview Компонент выбора типа кнопок для ответов
 * 
 * Позволяет выбрать тип кнопок для сбора ответов пользователя:
 * - Inline кнопки (встроенные в сообщение)
 * - Reply кнопки (виртуальная клавиатура)
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUTTON_TYPE_OPTIONS } from './button-type-config';

/** Пропсы компонента ButtonTypeSelector */
interface ButtonTypeSelectorProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент выбора типа кнопок для ответов
 * 
 * @param {ButtonTypeSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор типа кнопок
 */
export function ButtonTypeSelector({ selectedNode, onNodeUpdate }: ButtonTypeSelectorProps) {
  if (selectedNode.data.responseType !== 'buttons') return null;

  return (
    <div>
      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
        <i className="fas fa-mouse mr-1"></i>
        Тип кнопок
      </Label>
      <Select
        value={selectedNode.data.inputButtonType || 'inline'}
        onValueChange={(value: 'inline' | 'reply') => onNodeUpdate(selectedNode.id, { inputButtonType: value })}
      >
        <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 hover:border-blue-400/60 dark:hover:border-blue-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:focus:ring-blue-600/30 transition-all duration-200 rounded-lg text-blue-900 dark:text-blue-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BUTTON_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
