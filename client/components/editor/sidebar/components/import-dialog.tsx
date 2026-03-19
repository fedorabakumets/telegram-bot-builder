/**
 * @fileoverview Компонент диалога импорта проектов
 * Предоставляет интерфейс для импорта из JSON или Python кода
 * с поддержкой загрузки файлов через input элементы
 * @module components/editor/sidebar/components/import-dialog
 */

import React, { RefObject } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Пропсы для компонента ImportDialog
 */
export interface ImportDialogProps {
  /** Открыт ли диалог */
  isOpen: boolean;
  /** Состояние импорта: JSON текст, Python текст, ошибка */
  importState: {
    /** JSON текст для импорта */
    jsonText: string;
    /** Python текст для импорта */
    pythonText: string;
    /** Сообщение об ошибке */
    error: string;
  };
  /** Обработчик изменения состояния открытия диалога */
  onOpenChange: (open: boolean) => void;
  /** Обработчик изменения JSON текста */
  onJsonTextChange: (text: string) => void;
  /** Обработчик изменения Python текста */
  onPythonTextChange: (text: string) => void;
  /** Обработчик изменения ошибки */
  onErrorChange: (error: string) => void;
  /** Обработчик импорта проекта */
  onImport: () => void;
  /** Реф на input для загрузки JSON файла */
  fileInputRef: RefObject<HTMLInputElement>;
  /** Реф на input для загрузки Python файла */
  pythonFileInputRef: RefObject<HTMLInputElement>;
  /** Обработчик загрузки JSON файла */
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Обработчик загрузки Python файла */
  onPythonFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Компонент диалога импорта проектов
 * Предоставляет интерфейс для импорта проекта из JSON текста,
 * JSON файла или Python кода с конвертацией
 * @param props - Свойства компонента ImportDialogProps
 * @returns JSX элемент диалога импорта
 */
export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  importState,
  onOpenChange,
  onJsonTextChange,
  onPythonTextChange,
  onErrorChange,
  onImport,
  fileInputRef,
  pythonFileInputRef,
  onFileUpload,
  onPythonFileUpload,
}) => {
  /**
   * Обработчик очистки данных и закрытия диалога
   */
  const handleCancel = () => {
    onJsonTextChange('');
    onPythonTextChange('');
    onErrorChange('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Импортировать проект</DialogTitle>
          <DialogDescription>Вставьте JSON или загрузите файл с данными проекта</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Три раздела: JSON текст, JSON файл и Python код */}
          <div className="grid grid-cols-1 gap-4">
            {/* Вставка JSON текста */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-paste text-blue-500" />
                Вставьте JSON проекта
              </label>
              <Textarea
                value={importState.jsonText}
                onChange={(e) => {
                  onJsonTextChange(e.target.value);
                  onPythonTextChange('');
                  onErrorChange('');
                }}
                placeholder='{"name": "Мой бот", "description": "", "data": {...}}'
                className="font-mono text-xs h-40 resize-none"
                data-testid="textarea-import-json"
              />
            </div>

            {/* Загрузка JSON файла */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-file text-green-500" />
                Загрузить файл JSON
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={onFileUpload}
                className="hidden"
                data-testid="input-import-file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:bg-muted/50 transition-colors"
                data-testid="button-upload-file"
              >
                <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Нажмите для выбора файла</p>
                  <p className="text-xs text-muted-foreground">JSON / TXT файл</p>
                </div>
              </Button>
            </div>

            {/* Загрузка Python кода */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-python text-yellow-500" />
                Или загрузите Python код бота
              </label>
              <input
                ref={pythonFileInputRef}
                type="file"
                accept=".py,.txt"
                onChange={onPythonFileUpload}
                className="hidden"
                data-testid="input-import-python"
              />
              <Button
                onClick={() => pythonFileInputRef.current?.click()}
                variant="outline"
                className="w-full h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:bg-muted/50 transition-colors"
                data-testid="button-upload-python"
              >
                <i className="fas fa-code text-3xl text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Нажмите для выбора файла</p>
                  <p className="text-xs text-muted-foreground">Python (.py) файл</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Сообщение об ошибке */}
          {importState.error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive">{importState.error}</p>
            </div>
          )}

          {/* Кнопки управления */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              data-testid="button-cancel-import"
            >
              Отмена
            </Button>
            <Button
              onClick={onImport}
              disabled={!importState.jsonText.trim() && !importState.pythonText.trim()}
              data-testid="button-confirm-import"
            >
              <i className="fas fa-check mr-2" />
              Импортировать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
