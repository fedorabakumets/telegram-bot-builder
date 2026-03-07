/**
 * @fileoverview Компонент выбора типа клавиатуры
 *
 * Отображает переключатели между типами клавиатур:
 * - Inline (кнопки под сообщением)
 * - Reply (кнопки в поле ввода)
 * - None (без клавиатуры)
 *
 * @module KeyboardTypeSelector
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { KEYBOARD_TYPES } from '../../constants/keyboard.types';

/**
 * Пропсы компонента KeyboardTypeSelector
 */
interface KeyboardTypeSelectorProps {
  /** Узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Функция раскрытия секции */
  onToggle?: () => void;
}

/**
 * Компонент выбора типа клавиатуры
 *
 * Предоставляет два переключателя:
 * - Inline — кнопки отображаются под сообщением
 * - Reply — кнопки отображаются в поле ввода сообщения
 *
 * При включении одного типа, другой автоматически выключается.
 *
 * @param {KeyboardTypeSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор типа клавиатуры
 */
export function KeyboardTypeSelector({ selectedNode, onNodeUpdate, onToggle }: KeyboardTypeSelectorProps) {
  return (
    <div className="flex gap-2.5 sm:gap-3">
      {/* Inline Keyboard */}
      <div className="flex-1 flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/40">
        <label className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
          Inline
        </label>
        <Switch
          checked={selectedNode.data.keyboardType === KEYBOARD_TYPES.INLINE}
          onCheckedChange={(checked) => {
            onNodeUpdate(selectedNode.id, { keyboardType: checked ? KEYBOARD_TYPES.INLINE : KEYBOARD_TYPES.NONE });
            if (checked && onToggle) {
              onToggle();
            }
          }}
        />
      </div>
      {/* Reply Keyboard */}
      <div className="flex-1 flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/40">
        <label className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
          Reply
        </label>
        <Switch
          checked={selectedNode.data.keyboardType === KEYBOARD_TYPES.REPLY}
          onCheckedChange={(checked) => {
            onNodeUpdate(selectedNode.id, { keyboardType: checked ? KEYBOARD_TYPES.REPLY : KEYBOARD_TYPES.NONE });
            if (checked && onToggle) {
              onToggle();
            }
          }}
        />
      </div>
    </div>
  );
}
