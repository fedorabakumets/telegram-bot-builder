/**
 * @fileoverview Селектор действия кнопки
 * 
 * Компонент выбора действия (goto/command/url/selection).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';

/** Пропсы селектора действия */
interface ButtonActionSelectorProps {
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** ID узла */
  nodeId: string;
}

/**
 * Компонент селектора действия кнопки
 * 
 * @param {ButtonActionSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор действия
 */
export function ButtonActionSelector({
  button,
  onButtonUpdate,
  nodeId
}: ButtonActionSelectorProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-teal-50/40 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/40 dark:border-teal-800/30 hover:border-teal-300/60 dark:hover:border-teal-700/60 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-200/50 dark:bg-teal-900/40 group-hover:bg-teal-300/50 dark:group-hover:bg-teal-800/50 transition-all">
          <i className="fas fa-arrow-right text-xs sm:text-sm text-teal-600 dark:text-teal-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 cursor-pointer block">
            Действие
          </Label>
        </div>
      </div>
      <Select
        value={button.action}
        onValueChange={(value: 'goto' | 'command' | 'url' | 'selection') =>
          onButtonUpdate(nodeId, button.id, { action: value })
        }
      >
        <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 dark:focus:ring-teal-600/30 transition-all duration-200 rounded-lg text-teal-900 dark:text-teal-50">
          <SelectValue placeholder="Выберите действие" />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-teal-50/95 to-cyan-50/95 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl">
          <SelectItem value="goto">
            <div className="flex items-center gap-2">
              <i className="fas fa-right-long text-teal-600 dark:text-teal-400 text-xs"></i>
              <span>Перейти к экрану</span>
            </div>
          </SelectItem>
          <SelectItem value="command">
            <div className="flex items-center gap-2">
              <i className="fas fa-terminal text-orange-600 dark:text-orange-400 text-xs"></i>
              <span>Выполнить команду</span>
            </div>
          </SelectItem>
          <SelectItem value="url">
            <div className="flex items-center gap-2">
              <i className="fas fa-link text-blue-600 dark:text-blue-400 text-xs"></i>
              <span>Открыть ссылку</span>
            </div>
          </SelectItem>
          <SelectItem value="selection">
            <div className="flex items-center gap-2">
              <i className="fas fa-check-square text-green-600 dark:text-green-400 text-xs"></i>
              <span>Выбор опции</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
