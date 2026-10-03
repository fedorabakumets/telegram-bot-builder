/**
 * @fileoverview Меню действий активного листа на узкой панели
 */

import { Copy, MoreHorizontal, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Свойства меню действий листа */
interface CanvasSheetMenuProps {
  /** Можно удалить: в проекте больше одного листа */
  canDelete: boolean;
  /** Начать переименование */
  onRename: () => void;
  /** Дублировать лист */
  onDuplicate: () => void;
  /** Удалить лист */
  onDelete: () => void;
}

/**
 * Кнопка «⋯» с переименованием, дублированием и удалением.
 * @param props - Свойства меню
 * @returns Кнопка и выпадающее меню
 */
export function CanvasSheetMenu({ canDelete, onRename, onDuplicate, onDelete }: CanvasSheetMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex-shrink-0 p-0 h-9 w-9 rounded-lg" title="Действия с листом">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-44">
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="h-4 w-4 mr-2" /> Переименовать
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4 mr-2" /> Дублировать
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem className="text-red-500" onClick={onDelete}>
            <X className="h-4 w-4 mr-2" /> Удалить
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
