/**
 * @fileoverview Тоггл "Скрыть после использования"
 * 
 * Компонент переключателя скрытия кнопки после нажатия.
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';

/** Пропсы тоггла */
interface ButtonHideAfterClickToggleProps {
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** ID узла */
  nodeId: string;
  /** Тип клавиатуры */
  keyboardType?: 'inline' | 'reply' | 'none';
}

/**
 * Компонент тоггла "Скрыть после использования"
 * 
 * @param {ButtonHideAfterClickToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Тоггл
 */
export function ButtonHideAfterClickToggle({
  button,
  onButtonUpdate,
  nodeId,
  keyboardType
}: ButtonHideAfterClickToggleProps) {
  // Показываем для inline и reply, скрываем только если тип явно 'none'
  if (keyboardType === 'none') {
    return null;
  }

  // copy_text кнопки не отправляют callback — hideAfterClick физически невозможен
  if (button.action === 'copy_text') {
    return null;
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-red-50/40 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10 border border-red-200/40 dark:border-red-800/30 hover:border-red-300/60 dark:hover:border-red-700/60 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-200/50 dark:bg-red-900/40 group-hover:bg-red-300/50 dark:group-hover:bg-red-800/50 transition-all">
            <i className="fas fa-eye-slash text-xs sm:text-sm text-red-600 dark:text-red-400"></i>
          </div>
          <div className="min-w-0 flex-1">
            <Label className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 cursor-pointer block">
              Скрыть после использования
            </Label>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Switch
            checked={button.hideAfterClick ?? false}
            onCheckedChange={(checked) =>
              onButtonUpdate(nodeId, button.id, { hideAfterClick: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
