/**
 * @fileoverview Меню экспорта таблицы — CSV, JSON, буфер обмена
 * @module editor/tables/components/export-menu
 */

import { Download, FileJson, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tableToCsv } from '../utils/export-csv';
import { tableToJson } from '../utils/export-json';
import { tableToClipboard } from '../utils/export-clipboard';
import { downloadFile } from '../utils/download-file';
import type { BotTable } from '../types';

/** Пропсы компонента ExportMenu */
interface ExportMenuProps {
  /** Текущая выбранная таблица */
  table: BotTable;
}

/**
 * Выпадающее меню экспорта данных таблицы
 * @param props - Пропсы компонента
 * @returns JSX элемент меню экспорта
 */
export function ExportMenu({ table }: ExportMenuProps) {
  /** Скачать таблицу как CSV */
  const handleCsv = () => {
    const csv = tableToCsv(table.columns, table.rows);
    downloadFile(csv, `${table.name}.csv`, 'text/csv;charset=utf-8');
  };

  /** Скачать таблицу как JSON */
  const handleJson = () => {
    const json = tableToJson(table.columns, table.rows);
    downloadFile(json, `${table.name}.json`, 'application/json');
  };

  /** Скопировать таблицу в буфер обмена */
  const handleClipboard = () => {
    tableToClipboard(table.columns, table.rows);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleCsv}>
          <Download className="h-4 w-4" />
          Скачать CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleJson}>
          <FileJson className="h-4 w-4" />
          Скачать JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleClipboard}>
          <Copy className="h-4 w-4" />
          Скопировать в буфер
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
