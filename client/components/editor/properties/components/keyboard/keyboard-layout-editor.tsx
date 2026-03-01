/**
 * @fileoverview Главный компонент редактора раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-layout-editor
 */

import React from 'react';
import { Button } from '@/lib/bot-generator';
import { KeyboardLayout } from '../../types/keyboard-layout';
import { useKeyboardLayout } from '../../hooks/useKeyboardLayout';
import { KeyboardGridPreview } from './keyboard-grid-preview';
import { KeyboardPresetSelector } from './keyboard-preset-selector';
import { KeyboardLayoutActions } from './keyboard-layout-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** Свойства компонента KeyboardLayoutEditor */
export interface KeyboardLayoutEditorProps {
  /** Массив всех кнопок узла */
  buttons: Button[];
  /** Текущая раскладка (опционально) */
  initialLayout?: KeyboardLayout;
  /** Обработчик изменения раскладки */
  onLayoutChange?: (layout: KeyboardLayout) => void;
}

/**
 * Компонент редактора раскладки клавиатуры
 * Предоставляет визуальный интерфейс для управления расположением кнопок
 */
export function KeyboardLayoutEditor({
  buttons,
  initialLayout,
  onLayoutChange,
}: KeyboardLayoutEditorProps) {
  const {
    layout,
    setColumns,
    toggleAutoLayout,
    moveButton,
    addRow,
    removeRow,
  } = useKeyboardLayout(buttons, initialLayout);

  // Вызываем onLayoutChange при изменении раскладки
  React.useEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  if (buttons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎹 Расположение кнопок</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Добавьте кнопки в узле, чтобы настроить их расположение
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎹 Расположение кнопок</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <KeyboardPresetSelector
          columns={layout.columns}
          onColumnsChange={setColumns}
          disabled={layout.autoLayout}
        />

        <KeyboardLayoutActions
          autoLayout={layout.autoLayout}
          onToggleAutoLayout={toggleAutoLayout}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          rowsCount={layout.rows.length}
        />

        <KeyboardGridPreview
          buttons={buttons}
          layout={layout}
          onMoveButton={moveButton}
        />
      </CardContent>
    </Card>
  );
}
