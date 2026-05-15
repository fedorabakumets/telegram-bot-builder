/**
 * @fileoverview Выпадающее меню действий для строки переменной окружения
 * @module components/editor/bot/card/BotEnvRowMenu
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';

/** Свойства меню строки переменной */
interface BotEnvRowMenuProps {
  /** Имя переменной (для копирования ключа) */
  envKey: string;
  /** Можно ли редактировать */
  canEdit: boolean;
  /** Можно ли удалить */
  canDelete: boolean;
  /** Колбэк начала редактирования */
  onEdit: () => void;
  /** Колбэк удаления */
  onDelete?: () => void;
}

/**
 * Выпадающее меню действий для строки переменной
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvRowMenu({ envKey, canEdit, canDelete, onEdit, onDelete }: BotEnvRowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/row:opacity-100">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(envKey)}>
          <Copy className="h-3.5 w-3.5 mr-2" /> Копировать ключ
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Редактировать
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Удалить
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
