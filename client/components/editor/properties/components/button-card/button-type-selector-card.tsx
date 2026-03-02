/**
 * @fileoverview Селектор типа кнопки
 * 
 * Компонент выбора типа кнопки (normal/option/complete).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';

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
        value={button.buttonType || 'normal'}
        onValueChange={(value: 'normal' | 'option' | 'complete') => {
          if (value === 'option') {
            onButtonUpdate(nodeId, button.id, {
              buttonType: 'option',
              action: 'selection',
              target: ''
            });
          } else if (value === 'complete') {
            onButtonUpdate(nodeId, button.id, {
              buttonType: 'complete',
              action: 'goto',
              target: ''
            });
          } else {
            onButtonUpdate(nodeId, button.id, {
              buttonType: 'normal',
              action: 'goto',
              target: ''
            });
          }
        }}
      >
        <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 hover:border-blue-400/60 dark:hover:border-blue-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:focus:ring-blue-600/30 transition-all duration-200 rounded-lg text-blue-900 dark:text-blue-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/95 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
          <SelectItem value="normal">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
              <span>Обычная кнопка</span>
            </div>
          </SelectItem>
          <SelectItem value="option">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
              <span>Опция для выбора</span>
            </div>
          </SelectItem>
          <SelectItem value="complete">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
              <span>Кнопка завершения</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
