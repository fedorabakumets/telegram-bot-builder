/**
 * @fileoverview Компонент превью раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-grid-preview
 */

import React from 'react';
import { Button } from '@lib/bot-generator';
import { KeyboardLayout } from '../../types/keyboard-layout';
import { cn } from '@/utils/utils';

/** Свойства компонента KeyboardGridPreview */
export interface KeyboardGridPreviewProps {
  /** Массив всех кнопок */
  buttons: Button[];
  /** Текущая раскладка */
  layout: KeyboardLayout;
  /** Функция перемещения кнопки */
  onMoveButton: (buttonId: string, toRow: number, toIndex: number) => void;
  /** Дополнительные CSS классы */
  className?: string;
  /** Отключён ли drag-and-drop */
  disabled?: boolean;
}

/**
 * Компонент превью раскладки клавиатуры
 * Отображает визуальную сетку кнопок с drag-and-drop
 */
export function KeyboardGridPreview({
  buttons,
  layout,
  onMoveButton,
  className,
  disabled = false,
}: KeyboardGridPreviewProps) {
  const handleDragStart = (e: React.DragEvent, buttonId: string) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('buttonId', buttonId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
    buttonIndex: number
  ) => {
    if (disabled) return;
    e.preventDefault();
    const draggedButtonId = e.dataTransfer.getData('buttonId');
    if (draggedButtonId) {
      onMoveButton(draggedButtonId, rowIndex, buttonIndex);
    }
  };

  const getButtonText = (buttonId: string): string => {
    const button = buttons.find(b => b.id === buttonId);
    return button?.text || 'Кнопка';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {layout.rows.map((row, rowIndex) => (
        <div key={rowIndex}>
          {/* Зона для сброса перед рядом */}
          {!disabled && (
            <div
              className="h-2 mb-1 rounded hover:bg-primary/10 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                const buttonId = e.dataTransfer.getData('buttonId');
                if (buttonId) {
                  onMoveButton(buttonId, rowIndex, 0);
                }
              }}
            />
          )}
          <div
            className={cn(
              'flex gap-2 min-h-[48px] p-1 rounded-lg border transition-colors',
              disabled 
                ? 'border-transparent bg-muted/30 opacity-60' 
                : 'border-transparent hover:border-primary/20'
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnRow(e, rowIndex)}
          >
            {row.buttonIds.map((buttonId, buttonIndex) => (
              <div
                key={buttonId}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, buttonId)}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDropOnButton(e, rowIndex, buttonIndex);
                }}
                className={cn(
                  'flex-1 min-w-[120px] p-3 bg-muted rounded-md text-center text-sm border shadow-sm',
                  disabled
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-move hover:bg-accent transition-colors'
                )}
              >
                {getButtonText(buttonId)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Зона для сброса после последнего ряда */}
      {!disabled && layout.rows.length > 0 && (
        <div
          className="h-8 mt-2 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={(e) => {
            e.preventDefault();
            const buttonId = e.dataTransfer.getData('buttonId');
            if (buttonId) {
              onMoveButton(buttonId, layout.rows.length, 0);
            }
          }}
        >
          <span className="text-xs text-muted-foreground">
            Перетащите кнопку для создания нового ряда
          </span>
        </div>
      )}

      {/* Подсказка при авто-раскладке */}
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
