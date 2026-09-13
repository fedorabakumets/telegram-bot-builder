/**
 * @fileoverview Ячейка кнопки в превью раскладки с DnD и touch
 * @module components/editor/properties/components/keyboard/keyboard-grid-button-cell
 */

import React from 'react';
import { Button } from '@lib/bot-generator';
import { DYNAMIC_BUTTONS_PLACEHOLDER_ID } from '../../utils/keyboard-layout-utils';
import { buildDynamicButtonsPreviewItems } from '../../utils/dynamic-buttons';
import { getButtonStyleClassName } from '../../utils/button-style-classes';
import { cn } from '@/utils/utils';

/** Свойства ячейки кнопки */
export interface KeyboardGridButtonCellProps {
  /** ID кнопки */
  buttonId: string;
  /** Индекс ряда */
  rowIndex: number;
  /** Индекс в ряду */
  buttonIndex: number;
  /** Все кнопки узла */
  buttons: Button[];
  /** Конфиг динамических кнопок */
  dynamicButtonsConfig?: unknown;
  /** DnD выключен */
  disabled: boolean;
  /** Эта кнопка сейчас перетаскивается */
  isDragging: boolean;
  /** Старт HTML5 drag */
  onDragStart: (e: React.DragEvent, buttonId: string) => void;
  /** Drag over */
  onDragOver: (e: React.DragEvent) => void;
  /** Drop на кнопку */
  onDrop: (e: React.DragEvent, rowIndex: number, buttonIndex: number) => void;
  /** Touch start */
  onTouchStart: (e: React.TouchEvent, buttonId: string) => void;
  /** Touch move */
  onTouchMove: (e: React.TouchEvent) => void;
  /** Touch end */
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Touch cancel */
  onTouchCancel: () => void;
}

/**
 * Возвращает CSS-классы ячейки с учётом стиля и режима DnD
 * @param buttonId - ID кнопки
 * @param buttons - Все кнопки
 * @param disabled - DnD выключен
 * @returns Строка классов
 */
function getButtonCellClassName(
  buttonId: string,
  buttons: Button[],
  disabled: boolean,
): string {
  if (buttonId === DYNAMIC_BUTTONS_PLACEHOLDER_ID) {
    return 'bg-amber-50 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 cursor-move';
  }
  const button = buttons.find((item) => item.id === buttonId);
  const styleClass = getButtonStyleClassName(button?.style);
  if (disabled) return cn(styleClass, 'cursor-not-allowed opacity-60');
  return cn(styleClass, 'cursor-move hover:opacity-90 transition-colors');
}

/**
 * Одна кнопка в сетке раскладки
 * @param props - Свойства ячейки
 * @returns JSX элемент
 */
export function KeyboardGridButtonCell({
  buttonId,
  rowIndex,
  buttonIndex,
  buttons,
  dynamicButtonsConfig,
  disabled,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}: KeyboardGridButtonCellProps) {
  const text = buttons.find((item) => item.id === buttonId)?.text || 'Кнопка';

  return (
    <div
      data-kb-drop=""
      data-kb-drop-row={rowIndex}
      data-kb-drop-index={buttonIndex}
      draggable={!disabled}
      onDragStart={(e) => onDragStart(e, buttonId)}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(e, rowIndex, buttonIndex);
      }}
      onTouchStart={(e) => onTouchStart(e, buttonId)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      style={{ touchAction: disabled ? undefined : 'none' }}
      className={cn(
        'flex-1 min-w-[120px] p-3 rounded-md text-center text-sm border shadow-sm break-words select-none',
        getButtonCellClassName(buttonId, buttons, disabled),
        isDragging && 'opacity-40 pointer-events-none scale-95',
      )}
    >
      {buttonId === DYNAMIC_BUTTONS_PLACEHOLDER_ID ? (
        <div className="space-y-1">
          {buildDynamicButtonsPreviewItems(dynamicButtonsConfig).slice(0, 2).map((item, i) => (
            <div
              key={i}
              className={cn(
                'rounded px-2 py-1 border text-xs text-left',
                getButtonStyleClassName(item.style),
              )}
            >
              {item.text}
            </div>
          ))}
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">⚡ +ещё...</div>
        </div>
      ) : (
        text
      )}
    </div>
  );
}
