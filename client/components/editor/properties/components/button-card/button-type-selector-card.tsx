/**
 * @fileoverview Селектор типа кнопки
 *
 * Компонент выбора типа кнопки с действиями (goto/command/url/selection).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';
import { ButtonActionOption } from './button-action-options';

/** Пропсы селектора типа кнопки */
interface ButtonTypeSelectorProps {
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** ID узла */
  nodeId: string;
}

/**
 * Компонент селектора типа кнопки
 *
 * @param {ButtonTypeSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор типа
 */
export function ButtonTypeSelectorCard({
  button,
  onButtonUpdate,
  nodeId
}: ButtonTypeSelectorProps) {
  return (
    <div className="mb-3">
      <Label className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-2 block">Тип кнопки</Label>
      <Select
        value={button.action || 'goto'}
        onValueChange={(value: 'goto' | 'command' | 'url' | 'selection') =>
          onButtonUpdate(nodeId, button.id, { action: value })
        }
      >
        <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 dark:focus:ring-teal-600/30 transition-all duration-200 rounded-lg text-teal-900 dark:text-teal-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-teal-50/95 to-cyan-50/95 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl">
          <SelectItem value="goto">
            <ButtonActionOption action="goto" />
          </SelectItem>
          <SelectItem value="command">
            <ButtonActionOption action="command" />
          </SelectItem>
          <SelectItem value="url">
            <ButtonActionOption action="url" />
          </SelectItem>
          <SelectItem value="selection">
            <ButtonActionOption action="selection" />
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
