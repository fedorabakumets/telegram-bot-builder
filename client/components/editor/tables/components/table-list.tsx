/**
 * @fileoverview Список таблиц проекта (левая панель)
 * @module editor/tables/components/table-list
 */

import { useState } from 'react';
import { Plus, Table2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/utils';
import type { BotTable } from '../types';

/** Пропсы компонента TableList */
interface TableListProps {
  /** Список таблиц */
  tables: BotTable[];
  /** ID выбранной таблицы */
  selectedTableId: string | null;
  /** Обработчик выбора таблицы */
  onSelect: (tableId: string) => void;
  /** Обработчик создания таблицы */
  onCreate: (name: string) => void;
  /** Обработчик удаления таблицы */
  onDelete: (tableId: string) => void;
}

/**
 * Список таблиц с возможностью создания и удаления
 * @param props - Пропсы компонента
 * @returns JSX элемент списка таблиц
 */
export function TableList({ tables, selectedTableId, onSelect, onCreate, onDelete }: TableListProps) {
  /** Режим создания новой таблицы */
  const [isCreating, setIsCreating] = useState(false);
  /** Имя новой таблицы */
  const [newName, setNewName] = useState('');

  /** Подтверждение создания */
  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full w-56 border-r border-border/50 bg-muted/20">
      {/* Заголовок */}
      <div className="px-3 py-3 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Таблицы
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {tables.map((table) => (
          <div
            key={table.id}
            className={cn(
              'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm',
              selectedTableId === table.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted/60'
            )}
            onClick={() => onSelect(table.id)}
          >
            <Table2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate flex-1">{table.name}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(table.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}

        {/* Форма создания */}
        {isCreating && (
          <div className="mt-1 flex flex-col gap-1">
            <Input
              autoFocus
              placeholder="Имя таблицы"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="h-7 text-xs"
            />
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-xs flex-1" onClick={handleCreate}>
                Создать
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsCreating(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {tables.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Table2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Нет таблиц</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Создать первую
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
