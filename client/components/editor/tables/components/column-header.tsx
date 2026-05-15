/**
 * @fileoverview Заголовок колонки — переименование по клику, удаление через меню
 * @module editor/tables/components/column-header
 */

import { useState, useRef, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/utils';
import type { TableColumn } from '../types';

/** Пропсы заголовка колонки */
interface ColumnHeaderProps {
  /** Данные колонки */
  column: TableColumn;
  /** Обработчик переименования */
  onRename: (name: string) => void;
  /** Обработчик удаления */
  onDelete: () => void;
}

/**
 * Заголовок колонки с переименованием и контекстным меню
 * @param props - Пропсы компонента
 * @returns JSX элемент заголовка
 */
export function ColumnHeader({ column, onRename, onDelete }: ColumnHeaderProps) {
  /** Режим редактирования имени */
  const [editing, setEditing] = useState(false);
  /** Локальное имя */
  const [localName, setLocalName] = useState(column.name);
  /** Ссылка на input */
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  /** Подтверждение переименования */
  const commit = () => {
    setEditing(false);
    const trimmed = localName.trim();
    if (trimmed && trimmed !== column.name) {
      onRename(trimmed);
    } else {
      setLocalName(column.name);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setLocalName(column.name); setEditing(false); }
        }}
        className="w-full h-6 px-1 text-xs font-medium bg-background border border-primary outline-none rounded-sm"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 px-2 h-full cursor-pointer select-none',
            'text-xs font-medium truncate hover:text-foreground'
          )}
          onDoubleClick={() => { setLocalName(column.name); setEditing(true); }}
        >
          <span className="truncate">{column.name}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem onClick={() => { setLocalName(column.name); setEditing(true); }}>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          Переименовать
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
