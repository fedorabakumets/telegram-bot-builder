/**
 * @fileoverview Селектор действия кнопки
 *
 * Компонент выбора действия (goto/url/selection/complete).
 */

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { Button } from '@shared/schema';
import { ButtonActionOption, ButtonActionType, ACTION_CONFIG } from './button-action-options';

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
  const config = ACTION_CONFIG[button.action as ButtonActionType];

  return (
    <div className="space-y-2">
      <Select
        value={button.action}
        onValueChange={(value: Button['action']) =>
          onButtonUpdate(nodeId, button.id, { action: value })
        }
      >
        <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 dark:focus:ring-teal-600/30 transition-all duration-200 rounded-lg text-teal-900 dark:text-teal-50">
          <div className="flex items-center gap-2">
            <i className={`fas ${config.icon} ${config.color} text-xs`}></i>
            <span>{config.label}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-teal-50/95 to-cyan-50/95 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl">
          <SelectItem value="goto"><ButtonActionOption action="goto" /></SelectItem>
          <SelectItem value="url"><ButtonActionOption action="url" /></SelectItem>
          <SelectItem value="selection"><ButtonActionOption action="selection" /></SelectItem>
          <SelectItem value="complete"><ButtonActionOption action="complete" /></SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
