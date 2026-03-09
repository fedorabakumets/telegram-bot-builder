/**
 * @fileoverview Компонент настроек множественного выбора клавиатуры
 *
 * Отображает настройки для клавиатур с возможностью
 * множественного выбора (allowMultipleSelection).
 *
 * @module MultipleSelectionSettings
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента MultipleSelectionSettings
 */
interface MultipleSelectionSettingsProps {
  /** Узел для редактирования */
  selectedNode: Node;
  /** Тип клавиатуры (inline или reply) */
  keyboardType: 'inline' | 'reply';
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настроек множественного выбора
 *
 * Содержит:
 * - Переключатель множественного выбора
 * - Поле ввода переменной для сохранения (при включенном выборе)
 *
 * Для inline: отметки без перехода
 * Для reply: обновление после выбора
 *
 * @param {MultipleSelectionSettingsProps} props - Пропсы компонента
 * @returns {JSX.Element} Настройки множественного выбора
 */
export function MultipleSelectionSettings({
  selectedNode,
  keyboardType,
  onNodeUpdate
}: MultipleSelectionSettingsProps) {
  const description = keyboardType === 'inline'
    ? 'Отметки без перехода'
    : 'Обновление после выбора';

  return (
    <>
      {/* Переключатель множественного выбора */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40">
            <i className="fas fa-list-check text-xs text-blue-600 dark:text-blue-400"></i>
          </div>
          <div className="min-w-0">
            <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 cursor-pointer block">
              Множественный выбор
            </Label>
            <div className="text-xs text-blue-700/70 dark:text-blue-300/70 leading-snug">
              {description}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Switch
            checked={selectedNode.data.allowMultipleSelection ?? false}
            onCheckedChange={(checked) => {
              if (checked) {
                const hasCompleteButton = (selectedNode.data.buttons || []).some(
                  (btn: any) => btn.action === 'complete'
                );
                if (!hasCompleteButton) {
                  const completeButton = {
                    id: Date.now().toString(),
                    text: 'Готово',
                    action: 'complete' as const,
                    target: '',
                    skipDataCollection: false,
                    hideAfterClick: false
                  };
                  const currentButtons = selectedNode.data.buttons || [];
                  const updatedButtons = [...currentButtons, completeButton];
                  onNodeUpdate(selectedNode.id, {
                    allowMultipleSelection: checked,
                    buttons: updatedButtons
                  });
                  return;
                }
              }
              onNodeUpdate(selectedNode.id, { allowMultipleSelection: checked });
            }}
          />
        </div>
      </div>

      {/* Поле ввода переменной для множественного выбора */}
      {selectedNode.data.allowMultipleSelection && (
        <div className="space-y-2 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-teal-50/40 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/40 dark:border-teal-800/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-teal-200/50 dark:bg-teal-900/40">
              <i className="fas fa-tag text-xs text-teal-600 dark:text-teal-400"></i>
            </div>
            <div className="min-w-0 flex-1">
              <Label className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 cursor-pointer block">
                Переменная для сохранения
              </Label>
              <div className="text-xs text-teal-700/70 dark:text-teal-300/70 leading-snug">
                Опции сохраняются в переменную
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 focus-within:border-teal-500 dark:focus-within:border-teal-500">
            <i className="fas fa-code text-xs text-teal-600 dark:text-teal-400 flex-shrink-0"></i>
            <Input
              value={selectedNode.data.multiSelectVariable || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { multiSelectVariable: e.target.value })}
              className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none text-teal-900 dark:text-teal-50 placeholder:text-teal-500/50 dark:placeholder:text-teal-400/50 p-0"
              placeholder="выбранные_опции"
            />
          </div>
        </div>
      )}
    </>
  );
}
