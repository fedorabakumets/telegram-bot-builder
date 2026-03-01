/**
 * @fileoverview Тоггл "Не сохранять ответы"
 * 
 * Компонент переключателя пропуска сбора данных.
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';

/** Пропсы тоггла */
interface ButtonSkipDataToggleProps {
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** ID узла */
  nodeId: string;
  /** Флаг сбора пользовательского ввода */
  collectUserInput?: boolean;
}

/**
 * Компонент тоггла "Не сохранять ответы"
 * 
 * @param {ButtonSkipDataToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Тоггл
 */
export function ButtonSkipDataToggle({
  button,
  onButtonUpdate,
  nodeId,
  collectUserInput
}: ButtonSkipDataToggleProps) {
  if (!collectUserInput) {
    return null;
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-cyan-50/40 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-950/10 border border-cyan-200/40 dark:border-cyan-800/30 hover:border-cyan-300/60 dark:hover:border-cyan-700/60 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-cyan-200/50 dark:bg-cyan-900/40 group-hover:bg-cyan-300/50 dark:group-hover:bg-cyan-800/50 transition-all">
            <i className="fas fa-ban text-xs sm:text-sm text-cyan-600 dark:text-cyan-400"></i>
          </div>
          <div className="min-w-0 flex-1">
            <Label className="text-xs sm:text-sm font-semibold text-cyan-900 dark:text-cyan-100 cursor-pointer block">
              Не сохранять ответы
            </Label>
            <div className="text-xs text-cyan-700/70 dark:text-cyan-300/70 mt-0.5 leading-snug hidden sm:block">
              Кнопка работает только для навигации, без сбора данных
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Switch
            checked={button.skipDataCollection ?? false}
            onCheckedChange={(checked) =>
              onButtonUpdate(nodeId, button.id, { skipDataCollection: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
