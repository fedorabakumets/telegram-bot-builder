/**
 * @fileoverview Информационный блок для кнопки-опции при множественном выборе
 * 
 * Компонент отображает информацию о кнопке типа "option" и позволяет
 * настроить символ отметки для inline клавиатур.
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента OptionButtonInfo
 */
interface OptionButtonInfoProps {
  /** Текущий узел для редактирования */
  selectedNode: Node;
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Информационный блок кнопки-опции
 * 
 * @param props - Пропсы компонента
 * @returns JSX компонент информации об опции
 */
export function OptionButtonInfo({ selectedNode, onNodeUpdate }: OptionButtonInfoProps) {
  const isInline = selectedNode.data.keyboardType === 'inline';
  const checkmarkSymbol = selectedNode.data.checkmarkSymbol || '✅';

  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50/40 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/40 dark:border-green-800/30 hover:border-green-300/60 dark:hover:border-green-700/60 hover:bg-green-50/60 dark:hover:bg-green-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-200/50 dark:bg-green-900/40 group-hover:bg-green-300/50 dark:group-hover:bg-green-800/50 transition-all">
          <i className="fas fa-circle-check text-xs sm:text-sm text-green-600 dark:text-green-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100 cursor-pointer block">
            Опция для выбора
          </Label>
          <div className="text-xs text-green-700/70 dark:text-green-300/70 mt-0.5 leading-snug hidden sm:block">
            {isInline
              ? 'Добавляет отметку рядом с текстом'
              : 'Обновляет клавиатуру после выбора'
            }
          </div>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-green-700 dark:text-green-200 leading-relaxed">
        {isInline
          ? `При нажатии появится отметка: ${checkmarkSymbol}`
          : 'После выбора покажется обновленная клавиатура'
        }
      </div>

      {isInline && (
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">Символ отметки</Label>
          <Input
            value={checkmarkSymbol}
            onChange={(e) => onNodeUpdate(selectedNode.id, { checkmarkSymbol: e.target.value })}
            className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-green-300/40 dark:border-green-700/40 text-green-900 dark:text-green-50 placeholder:text-green-500/50 dark:placeholder:text-green-400/50 focus:border-green-500 focus:ring-2 focus:ring-green-400/30"
            placeholder="✅"
            maxLength={3}
          />
        </div>
      )}
    </div>
  );
}
