/**
 * @fileoverview Главный компонент редактора раскладки клавиатуры
 * @module components/editor/properties/components/keyboard/keyboard-layout-editor
 */

import React, { useState } from 'react';
import { Button } from '@/lib/bot-generator';
import { KeyboardLayout } from '../../types/keyboard-layout';
import { useKeyboardLayout } from '../../hooks/useKeyboardLayout';
import { KeyboardGridPreview } from './keyboard-grid-preview';
import { KeyboardPresetSelector } from './keyboard-preset-selector';
import { KeyboardLayoutActions } from './keyboard-layout-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

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
  const [isOpen, setIsOpen] = useState(false);

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
  }, [layout]);

  if (buttons.length === 0) {
    return null;
  }

  return (
    <Card className="transition-all">
      <CardHeader 
        className="cursor-pointer py-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isOpen ? "bg-primary/10" : "bg-muted"
            )}>
              <span className="text-lg">🎹</span>
            </div>
            <div>
              <CardTitle className="text-base">Расположение кнопок</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {layout.autoLayout 
                  ? `Авто: ${layout.columns} ${layout.columns === 1 ? 'колонка' : layout.columns < 5 ? 'колонки' : 'колонок'}`
                  : `Ручная: ${layout.rows.length} ${layout.rows.length === 1 ? 'ряд' : layout.rows.length < 5 ? 'ряда' : 'рядов'}`
                }
              </CardDescription>
            </div>
          </div>
          <div className={cn(
            "p-2 rounded-md transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          )}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>

      {isOpen && (
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
            disabled={layout.autoLayout}
          />
        </CardContent>
      )}
    </Card>
  );
}
