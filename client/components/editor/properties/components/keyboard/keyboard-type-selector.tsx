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

/**
 * Пропсы компонента KeyboardTypeSelector
 */
interface KeyboardTypeSelectorProps {
  /** Узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
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
export function KeyboardTypeSelector({ selectedNode, onNodeUpdate }: KeyboardTypeSelectorProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-300">
      <label className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
        <i className="fas fa-cog text-amber-600 dark:text-amber-400 text-xs"></i>
        Тип клавиатуры
      </label>
      <div className="flex gap-2.5 sm:gap-3">
        {/* Inline Keyboard */}
        <div className="flex-1 flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/50 dark:bg-slate-950/30 border border-amber-200/40 dark:border-amber-800/40 hover:border-amber-300/60 dark:hover:border-amber-700/60 hover:bg-white/70 dark:hover:bg-slate-900/50 transition-all duration-200">
          <label className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
            Inline
          </label>
          <Switch
            checked={selectedNode.data.keyboardType === 'inline'}
            onCheckedChange={(checked) => {
              onNodeUpdate(selectedNode.id, { keyboardType: checked ? 'inline' : 'none' });
            }}
          />
        </div>
        {/* Reply Keyboard */}
        <div className="flex-1 flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/50 dark:bg-slate-950/30 border border-amber-200/40 dark:border-amber-800/40 hover:border-amber-300/60 dark:hover:border-amber-700/60 hover:bg-white/70 dark:hover:bg-slate-900/50 transition-all duration-200">
          <label className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
            Reply
          </label>
          <Switch
            checked={selectedNode.data.keyboardType === 'reply'}
            onCheckedChange={(checked) => {
              onNodeUpdate(selectedNode.id, { keyboardType: checked ? 'reply' : 'none' });
            }}
          />
        </div>
      </div>
    </div>
  );
}
