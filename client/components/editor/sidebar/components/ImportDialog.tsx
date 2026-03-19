/**
 * @fileoverview Компонент диалога импорта проектов
 * Предоставляет интерфейс для импорта из JSON или Python кода
 * @module components/editor/sidebar/components/ImportDialog
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Code, FileJson } from 'lucide-react';

/**
 * Пропсы для компонента ImportDialog
 */
export interface ImportDialogProps {
  /** Открыт ли диалог */
  isOpen: boolean;
  /** JSON текст для импорта */
  jsonText: string;
  /** Python текст для импорта */
  pythonText: string;
  /** Текст ошибки */
  error: string;
  /** Обработчик закрытия диалога */
  onClose: () => void;
  /** Обработчик изменения JSON текста */
  onJsonTextChange: (text: string) => void;
  /** Обработчик изменения Python текста */
  onPythonTextChange: (text: string) => void;
  /** Обработчик импорта */
  onImport: () => void;
}

/**
 * Компонент диалога импорта проектов
 */
export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  jsonText,
  pythonText,
  error,
  onClose,
  onJsonTextChange,
  onPythonTextChange,
  onImport,
}) => {
  const handleClear = () => {
    onJsonTextChange('');
    onPythonTextChange('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Импорт проекта</DialogTitle>
          <DialogDescription>
            Вставьте JSON или Python код бота для импорта
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* JSON импорт */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              <label className="text-sm font-medium">JSON формат</label>
            </div>
            <Textarea
              placeholder='{"name": "My Bot", "data": {...}}'
              value={jsonText}
              onChange={(e) => onJsonTextChange(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          {/* Python импорт */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <label className="text-sm font-medium">Python код</label>
            </div>
            <Textarea
              placeholder="# @@NODE_START:start@@ ..."
              value={pythonText}
              onChange={(e) => onPythonTextChange(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClear}>
            Очистить
          </Button>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onImport}>
            Импортировать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
