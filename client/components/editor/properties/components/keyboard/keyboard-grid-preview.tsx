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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, rowIndex: number, buttonIndex: number) => {
    e.preventDefault();
    const buttonId = e.dataTransfer.getData('buttonId');
    if (buttonId) {
      onMoveButton(buttonId, rowIndex, buttonIndex);
    }
  };

  const getButtonText = (buttonId: string): string => {
    const button = buttons.find(b => b.id === buttonId);
    return button?.text || 'Кнопка';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {layout.rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-2"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, rowIndex, row.buttonIds.length)}
        >
          {row.buttonIds.map((buttonId, buttonIndex) => (
            <div
              key={buttonId}
              draggable
              onDragStart={(e) => handleDragStart(e, buttonId)}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                const draggedButtonId = e.dataTransfer.getData('buttonId');
                if (draggedButtonId && draggedButtonId !== buttonId) {
                  onMoveButton(draggedButtonId, rowIndex, buttonIndex);
                }
              }}
              className={cn(
                'flex-1 min-w-[120px] p-3 bg-muted rounded-md cursor-move',
                'hover:bg-accent transition-colors text-center text-sm'
              )}
            >
              {getButtonText(buttonId)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
