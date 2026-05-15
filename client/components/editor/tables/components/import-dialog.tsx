/**
 * @fileoverview Диалог импорта данных из CSV/JSON файлов в таблицу
 * @module editor/tables/components/import-dialog
 */

import { useState, useCallback } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { parseCsv } from '../utils/parse-csv';
import { parseJsonTable } from '../utils/parse-json';

/** Пропсы диалога импорта */
interface ImportDialogProps {
  /** Диалог открыт */
  open: boolean;
  /** Закрыть диалог */
  onClose: () => void;
  /** Импорт как новая таблица: имя, колонки, строки */
  onImportNew: (name: string, columns: string[], rows: string[][]) => void;
  /** Импорт строк в текущую таблицу */
  onImportRows: (rows: string[][]) => void;
  /** Есть ли выбранная таблица (для режима "добавить в текущую") */
  hasSelectedTable: boolean;
}

/** Режим импорта */
type ImportMode = 'new' | 'append';

/**
 * Диалог импорта данных с drag&drop зоной
 * @param props - Пропсы компонента
 * @returns JSX элемент диалога
 */
export function ImportDialog({
  open,
  onClose,
  onImportNew,
  onImportRows,
  hasSelectedTable,
}: ImportDialogProps) {
  /** Режим импорта */
  const [mode, setMode] = useState<ImportMode>('new');
  /** Имя файла (без расширения) */
  const [fileName, setFileName] = useState('');
  /** Распарсенные колонки */
  const [columns, setColumns] = useState<string[]>([]);
  /** Распарсенные строки */
  const [rows, setRows] = useState<string[][]>([]);
  /** Ошибка парсинга */
  const [error, setError] = useState<string | null>(null);
  /** Файл перетаскивается */
  const [dragging, setDragging] = useState(false);

  /** Сброс состояния */
  const reset = useCallback(() => {
    setFileName('');
    setColumns([]);
    setRows([]);
    setError(null);
    setDragging(false);
  }, []);

  /** Обработка файла */
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const name = file.name.replace(/\.(csv|json)$/i, '');
    setFileName(name);

    try {
      const text = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        const result = parseCsv(text);
        setColumns(result.columns);
        setRows(result.rows);
      } else if (ext === 'json') {
        const result = parseJsonTable(text);
        setColumns(result.columns);
        setRows(result.rows);
      } else {
        setError('Поддерживаются только .csv и .json файлы');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка чтения файла');
    }
  }, []);

  /** Обработчик drop */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  /** Обработчик выбора файла через input */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  /** Подтверждение импорта */
  const handleImport = () => {
    if (mode === 'new') {
      onImportNew(fileName || 'Импорт', columns, rows);
    } else {
      onImportRows(rows);
    }
    reset();
    onClose();
  };

  /** Закрытие диалога */
  const handleClose = () => {
    reset();
    onClose();
  };

  /** Превью: первые 5 строк */
  const previewRows = rows.slice(0, 5);
  const hasData = columns.length > 0 && rows.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Импорт данных
          </DialogTitle>
        </DialogHeader>

        {/* Drag & Drop зона */}
        {!hasData && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Перетащите .csv или .json файл сюда
            </p>
            <label className="cursor-pointer">
              <span className="text-sm text-primary underline">или выберите файл</span>
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleInputChange}
              />
            </label>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Превью данных */}
        {hasData && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Файл: <strong>{fileName}</strong> — {columns.length} колонок, {rows.length} строк
            </p>

            {/* Мини-таблица превью */}
            <div className="border rounded-md overflow-auto max-h-40">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/60">
                    {columns.map((col, i) => (
                      <th key={i} className="px-2 py-1 border-r border-b text-left font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-b">
                      {columns.map((_, ci) => (
                        <td key={ci} className="px-2 py-1 border-r truncate max-w-[120px]">
                          {row[ci] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Выбор режима */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === 'new' ? 'default' : 'outline'}
                onClick={() => setMode('new')}
              >
                Создать новую таблицу
              </Button>
              {hasSelectedTable && (
                <Button
                  size="sm"
                  variant={mode === 'append' ? 'default' : 'outline'}
                  onClick={() => setMode('append')}
                >
                  Добавить в текущую
                </Button>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button onClick={handleImport} disabled={!hasData}>
            Импортировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
