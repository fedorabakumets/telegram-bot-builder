/**
 * @fileoverview Кнопки экспорта/импорта всех таблиц проекта (в шапке панели)
 * @module editor/tables/components/all-tables-actions
 */

import { useState, useCallback } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { exportAllTables } from '../utils/export-all-tables';
import { parseAllTablesExport } from '../utils/import-all-tables';
import type { ImportedTable } from '../utils/import-all-tables';

/** Пропсы компонента */
interface AllTablesActionsProps {
  /** ID проекта */
  projectId: number;
  /** Импорт таблицы (имя, колонки, строки) */
  onImportTable: (name: string, columns: string[], rows: string[][]) => Promise<void>;
}

/**
 * Кнопки экспорта и импорта всех таблиц проекта
 * @param props - Пропсы компонента
 * @returns JSX элемент с кнопками
 */
export function AllTablesActions({ projectId, onImportTable }: AllTablesActionsProps) {
  /** Диалог импорта открыт */
  const [importOpen, setImportOpen] = useState(false);
  /** Распарсенные таблицы для превью */
  const [parsed, setParsed] = useState<ImportedTable[]>([]);
  /** Ошибка парсинга */
  const [error, setError] = useState<string | null>(null);
  /** Процесс импорта */
  const [importing, setImporting] = useState(false);

  /** Экспорт всех таблиц */
  const handleExport = useCallback(() => {
    exportAllTables(projectId);
  }, [projectId]);

  /** Обработка файла импорта */
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const result = parseAllTablesExport(text);
      setParsed(result.tables);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка чтения файла');
    }
  }, []);

  /** Подтверждение импорта */
  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      for (const table of parsed) {
        await onImportTable(table.name, table.columns, table.rows);
      }
    } finally {
      setImporting(false);
      setParsed([]);
      setImportOpen(false);
    }
  }, [parsed, onImportTable]);

  /** Закрытие диалога */
  const handleClose = () => {
    setParsed([]);
    setError(null);
    setImportOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5"
          onClick={handleExport}
          title="Экспорт всех таблиц"
        >
          <Download className="h-3.5 w-3.5" />
          Экспорт всех
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5"
          onClick={() => setImportOpen(true)}
          title="Импорт таблиц из файла"
        >
          <Upload className="h-3.5 w-3.5" />
          Импорт всех
        </Button>
      </div>

      {/* Диалог импорта всех таблиц */}
      <Dialog open={importOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Импорт всех таблиц</DialogTitle>
          </DialogHeader>

          {parsed.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Выберите файл экспорта (.json)
              </p>
              <label className="cursor-pointer">
                <span className="text-sm text-primary underline">Выбрать файл</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Найдено таблиц: <strong>{parsed.length}</strong>
              </p>
              <ul className="text-sm space-y-1 max-h-40 overflow-auto">
                {parsed.map((t, i) => (
                  <li key={i} className="flex justify-between px-2 py-1 bg-muted/30 rounded">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground">
                      {t.columns.length} кол. / {t.rows.length} стр.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button onClick={handleImport} disabled={parsed.length === 0 || importing}>
              {importing ? 'Импорт...' : 'Импортировать все'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
