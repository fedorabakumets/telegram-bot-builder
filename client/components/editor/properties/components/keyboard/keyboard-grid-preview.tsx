/**
 * @fileoverview Компонент превью раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-grid-preview
 */

import React from 'react';
import { Button } from '@lib/bot-generator';
import { KeyboardLayout } from '../../types/keyboard-layout';
import { cn } from '@/utils/utils';
import { KeyboardGridButtonCell } from './keyboard-grid-button-cell';
import { useKeyboardGridTouch } from './use-keyboard-grid-touch';

/** Свойства компонента KeyboardGridPreview */
export interface KeyboardGridPreviewProps {
  /** Массив всех кнопок */
  buttons: Button[];
  /** Текущая раскладка */
  layout: KeyboardLayout;
  /** Функция перемещения кнопки */
  onMoveButton: (buttonId: string, toRow: number, toIndex: number) => void;
  /** Конфигурация динамических кнопок для превью */
  dynamicButtonsConfig?: unknown;
  /** Дополнительные CSS классы */
  className?: string;
  /** Отключён ли drag-and-drop */
  disabled?: boolean;
}

/**
 * Превью раскладки с HTML5 и touch перетаскиванием
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function KeyboardGridPreview({
  buttons,
  layout,
  onMoveButton,
  dynamicButtonsConfig,
  className,
  disabled = false,
}: KeyboardGridPreviewProps) {
  const { draggingId, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel } =
    useKeyboardGridTouch(disabled, onMoveButton);

  const handleDragStart = (e: React.DragEvent, buttonId: string) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('buttonId', buttonId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnRow = (e: React.DragEvent, rowIndex: number) => {
    if (disabled) return;
    e.preventDefault();
    const buttonId = e.dataTransfer.getData('buttonId');
    if (buttonId) {
      onMoveButton(buttonId, rowIndex, layout.rows[rowIndex]?.buttonIds.length || 0);
    }
  };

  const handleDropOnButton = (
    e: React.DragEvent,
    rowIndex: number,
    buttonIndex: number,
  ) => {
    if (disabled) return;
    e.preventDefault();
    const draggedButtonId = e.dataTransfer.getData('buttonId');
    if (draggedButtonId) onMoveButton(draggedButtonId, rowIndex, buttonIndex);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {layout.rows.map((row, rowIndex) => (
        <div key={rowIndex}>
          {!disabled && (
            <div
              data-kb-drop=""
              data-kb-drop-row={rowIndex}
              data-kb-drop-index={0}
              className="h-2 mb-1 rounded hover:bg-primary/10 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                const buttonId = e.dataTransfer.getData('buttonId');
                if (buttonId) onMoveButton(buttonId, rowIndex, 0);
              }}
            />
          )}
          <div
            data-kb-drop=""
            data-kb-drop-row={rowIndex}
            data-kb-drop-index={row.buttonIds.length}
            className={cn(
              'flex gap-2 min-h-[48px] p-1 rounded-lg border transition-colors',
              disabled
                ? 'border-transparent bg-muted/30 opacity-60'
                : 'border-transparent hover:border-primary/20',
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnRow(e, rowIndex)}
          >
            {row.buttonIds.map((buttonId, buttonIndex) => (
              <KeyboardGridButtonCell
                key={buttonId}
                buttonId={buttonId}
                rowIndex={rowIndex}
                buttonIndex={buttonIndex}
                buttons={buttons}
                dynamicButtonsConfig={dynamicButtonsConfig}
                disabled={disabled}
                isDragging={draggingId === buttonId}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDropOnButton}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchCancel}
              />
            ))}
          </div>
        </div>
      ))}

      {!disabled && layout.rows.length > 0 && (
        <div
          data-kb-drop=""
          data-kb-drop-row={layout.rows.length}
          data-kb-drop-index={0}
          className="h-8 mt-2 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center"
          onDragOver={handleDragOver}
          onDrop={(e) => {
            e.preventDefault();
            const buttonId = e.dataTransfer.getData('buttonId');
            if (buttonId) onMoveButton(buttonId, layout.rows.length, 0);
          }}
        >
          <span className="text-xs text-muted-foreground">
            Перетащите кнопку для создания нового ряда
          </span>
        </div>
      )}

      {disabled && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Авто-раскладка включена.</strong> Кнопки автоматически распределяются по колонкам.
            Отключите авто-раскладку для ручного управления расположением.
          </p>
        </div>
      )}
    </div>
  );
}
