/**
 * @fileoverview Панель действий для управления базой ID
 * Кнопки добавления, импорта, экспорта и очистки
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Upload, Download, Trash2 } from 'lucide-react';

interface UserIdActionsProps {
  /** Обработчик добавления ID */
  onAdd: () => void;
  /** Обработчик импорта */
  onImport: () => void;
  /** Обработчик экспорта всех */
  onExportAll: () => void;
  /** Обработчик очистки всей базы */
  onClearAll: () => void;
  /** Количество записей */
  totalCount: number;
}

/**
 * Компонент действий для управления базой ID
 */
export function UserIdActions({
  onAdd,
  onImport,
  onExportAll,
  onClearAll,
  totalCount,
}: UserIdActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onAdd} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Добавить ID
      </Button>

      <Button variant="outline" onClick={onImport} size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Импорт
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={totalCount === 0}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportAll}>
            Экспортировать все ({totalCount})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={totalCount === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Очистить
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onClearAll}
            className="text-destructive focus:text-destructive"
          >
            Удалить все {totalCount} записей
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
