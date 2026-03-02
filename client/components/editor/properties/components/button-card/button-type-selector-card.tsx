/**
 * @fileoverview Комбинированный селектор типа и действия кнопки
 *
 * Компонент выбора типа кнопки (normal/option/complete) и действия (goto/command/url/selection).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';
import { ButtonActionOption, type ButtonActionType } from './button-action-options';
import { ButtonTypeOption } from './button-type-option';

/** Пропсы комбинированного селектора */
interface ButtonTypeSelectorProps {
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** ID узла */
  nodeId: string;
}

/**
 * Комбинированный селектор типа и действия кнопки
 *
 * @param {ButtonTypeSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор типа и действия
 */
export function ButtonTypeSelectorCard({
  button,
  onButtonUpdate,
  nodeId
}: ButtonTypeSelectorProps) {
  return (
    <div className="mb-3 space-y-2">
      <div>
        <Label className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2 block">Тип кнопки</Label>
        <Select
          value={button.buttonType || 'normal'}
          onValueChange={(value: 'normal' | 'option' | 'complete') => {
            const updates: Partial<Button> = { buttonType: value };
            if (value === 'option') updates.action = 'selection';
            else if (value === 'complete') updates.action = 'goto';
            else updates.action = 'goto';
            onButtonUpdate(nodeId, button.id, updates);
          }}
        >
          <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 hover:border-blue-400/60 dark:hover:border-blue-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:focus:ring-blue-600/30 transition-all duration-200 rounded-lg text-blue-900 dark:text-blue-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-blue-50/95 to-sky-50/95 dark:from-slate-900/95 dark:to-slate-800/95">
            <SelectItem value="normal"><ButtonTypeOption buttonType="normal" /></SelectItem>
            <SelectItem value="option"><ButtonTypeOption buttonType="option" /></SelectItem>
            <SelectItem value="complete"><ButtonTypeOption buttonType="complete" /></SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-2 block">Действие</Label>
        <Select
          value={button.action || 'goto'}
          onValueChange={(value: ButtonActionType) =>
            onButtonUpdate(nodeId, button.id, { action: value })
          }
        >
          <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 dark:focus:ring-teal-600/30 transition-all duration-200 rounded-lg text-teal-900 dark:text-teal-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-teal-50/95 to-cyan-50/95 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl max-h-64 overflow-y-auto">
            <SelectItem value="goto"><ButtonActionOption action="goto" /></SelectItem>
            <SelectItem value="command"><ButtonActionOption action="command" /></SelectItem>
            <SelectItem value="url"><ButtonActionOption action="url" /></SelectItem>
            <SelectItem value="selection"><ButtonActionOption action="selection" /></SelectItem>
            <SelectItem value="complete_button"><ButtonActionOption action="complete_button" /></SelectItem>
            <SelectItem value="contact"><ButtonActionOption action="contact" /></SelectItem>
            <SelectItem value="location"><ButtonActionOption action="location" /></SelectItem>
            <SelectItem value="default"><ButtonActionOption action="default" /></SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
