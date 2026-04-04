/**
 * @fileoverview Поле ввода кастомного callback_data для inline-кнопки с валидацией байт
 *
 * Показывает поле ввода только для inline-кнопок с действиями goto/command.
 * Если поле пустое — используется авто-генерируемое значение (отображается как placeholder).
 * Telegram ограничивает callback_data до 64 байт — отображается счётчик и предупреждение.
 * @module components/editor/properties/components/button-card/button-callback-field
 */

import { Input } from '@/components/ui/input';
import type { Button } from '@shared/schema';

/** Максимальный размер callback_data в байтах (ограничение Telegram) */
const MAX_CALLBACK_BYTES = 64;

/** Действия, для которых показывается поле callback_data */
const INLINE_ACTIONS = ['goto', 'command'] as const;
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
 * Считает количество байт в строке (UTF-8)
 * Кириллица занимает 2 байта, латиница — 1
 *
 * @param str - Строка для подсчёта
 * @returns Количество байт
 */
function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Вычисляет авто-генерируемое значение callback_data по типу действия
 *
 * @param action - Действие кнопки (goto или command)
 * @param button - Объект кнопки
 * @returns Авто-значение callback_data
 */
function computeAutoCallbackData(
  action: InlineAction,
  button: ButtonCallbackFieldProps['button'],
): string {
  switch (action) {
    case 'goto':
      return button.target || button.id || 'no_action';
    case 'command':
      return `cmd_${(button.target || '').replace('/', '') || 'unknown'}`;
    default:
      return button.id;
  }
}

/**
 * Поле ввода кастомного callback_data для inline-кнопки.
 * Отображается только при keyboardType === 'inline' и подходящем action.
 * Показывает счётчик байт и предупреждение при превышении лимита Telegram.
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

  const autoValue = computeAutoCallbackData(button.action as InlineAction, button);
  const currentValue = button.customCallbackData ?? '';
  const byteCount = getByteLength(currentValue);
  const isOverLimit = byteCount > MAX_CALLBACK_BYTES;

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none">
        callback_data
      </span>
      <Input
        value={currentValue}
        onChange={(e) =>
          onButtonUpdate(nodeId, button.id, {
            customCallbackData: e.target.value || undefined,
          })
        }
        className={[
          'h-6 text-[11px] font-mono bg-white/60 dark:bg-slate-950/60 text-blue-900 dark:text-blue-50',
          'placeholder:text-blue-400/40 dark:placeholder:text-blue-500/40 rounded-md px-2 py-0',
          isOverLimit
            ? 'border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-400/30'
            : 'border border-blue-300/40 dark:border-blue-700/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30',
        ].join(' ')}
        placeholder={autoValue}
      />
      {currentValue && (
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {byteCount} / {MAX_CALLBACK_BYTES} байт
          </span>
          {isOverLimit && (
            <span className="text-[10px] text-red-500">
              Превышен лимит Telegram (64 байта)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
