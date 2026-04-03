/**
 * @fileoverview Поле ввода кастомного callback_data для inline-кнопки
 *
 * Показывает поле ввода только для inline-кнопок с действиями goto/command/selection/complete.
 * Если поле пустое — используется авто-генерируемое значение (отображается как placeholder).
 * @module components/editor/properties/components/button-card/button-callback-field
 */

import { Input } from '@/components/ui/input';
import type { Button } from '@shared/schema';

/** Действия, для которых показывается поле callback_data */
const INLINE_ACTIONS = ['goto', 'command', 'selection', 'complete'] as const;
type InlineAction = typeof INLINE_ACTIONS[number];

/** Пропсы поля callback_data */
interface ButtonCallbackFieldProps {
  /** ID узла (нужен для генерации авто-значения) */
  nodeId: string;
  /** Объект кнопки */
  button: Button & { shortButtonId?: string };
  /** Тип клавиатуры */
  keyboardType?: string;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
}

/**
 * Вычисляет авто-генерируемое значение callback_data по типу действия
 *
 * @param action - Действие кнопки
 * @param button - Объект кнопки
 * @param nodeId - ID узла
 * @returns Авто-значение callback_data
 */
function computeAutoCallbackData(
  action: InlineAction,
  button: ButtonCallbackFieldProps['button'],
  nodeId: string,
): string {
  switch (action) {
    case 'goto':
      return button.target || button.id || 'no_action';
    case 'command':
      return `cmd_${(button.target || '').replace('/', '') || 'unknown'}`;
    case 'selection':
      return `ms_${nodeId}_${button.shortButtonId || button.target || button.id || 'btn'}`;
    case 'complete':
      return button.target || button.id || `done_${nodeId}`;
    default:
      return button.id;
  }
}

/**
 * Поле ввода кастомного callback_data для inline-кнопки.
 * Отображается только при keyboardType === 'inline' и подходящем action.
 *
 * @param props - Пропсы компонента
 * @returns JSX элемент или null
 */
export function ButtonCallbackField({
  nodeId,
  button,
  keyboardType,
  onButtonUpdate,
}: ButtonCallbackFieldProps) {
  if (keyboardType !== 'inline') return null;
  if (!INLINE_ACTIONS.includes(button.action as InlineAction)) return null;

  const autoValue = computeAutoCallbackData(button.action as InlineAction, button, nodeId);

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none">
        callback_data
      </span>
      <Input
        value={button.customCallbackData ?? ''}
        onChange={(e) =>
          onButtonUpdate(nodeId, button.id, {
            customCallbackData: e.target.value || undefined,
          })
        }
        className="h-6 text-[11px] font-mono bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 text-blue-900 dark:text-blue-50 placeholder:text-blue-400/40 dark:placeholder:text-blue-500/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 rounded-md px-2 py-0"
        placeholder={autoValue}
      />
    </div>
  );
}
