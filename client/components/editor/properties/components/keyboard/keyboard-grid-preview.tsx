/**
 * @fileoverview Компонент превью раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-grid-preview
 */

import React from 'react';
import { Button } from '@/lib/bot-generator';
import { KeyboardLayout } from '../../types/keyboard-layout';
import { cn } from '@/lib/bot-generator/utils';

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
}: KeyboardGridPreviewProps) {
  const handleDragStart = (e: React.DragEvent, buttonId: string) => {
    e.dataTransfer.setData('buttonId', buttonId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnRow = (e: React.DragEvent, rowIndex: number) => {
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
          <div
            className="flex gap-2 min-h-[48px] p-1 rounded-lg border border-transparent hover:border-primary/20 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnRow(e, rowIndex)}
          >
            {row.buttonIds.map((buttonId, buttonIndex) => (
              <div
                key={buttonId}
                draggable
                onDragStart={(e) => handleDragStart(e, buttonId)}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDropOnButton(e, rowIndex, buttonIndex);
                }}
                className={cn(
                  'flex-1 min-w-[120px] p-3 bg-muted rounded-md cursor-move',
                  'hover:bg-accent transition-colors text-center text-sm',
                  'border border-border shadow-sm'
                )}
              >
                {getButtonText(buttonId)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Зона для сброса после последнего ряда */}
      {layout.rows.length > 0 && (
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
    </div>
  );
}
