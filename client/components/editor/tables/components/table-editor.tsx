/**
 * @fileoverview Редактор содержимого таблицы (правая панель)
 * @module editor/tables/components/table-editor
 */

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import type { BotTable, ColumnType } from '../types';

/** Пропсы компонента TableEditor */
interface TableEditorProps {
  /** Таблица для редактирования */
  table: BotTable;
  /** Добавить колонку */
  onAddColumn: (column: { name: string; type: ColumnType }) => void;
  /** Удалить колонку */
  onDeleteColumn: (columnId: string) => void;
  /** Добавить строку */
  onAddRow: () => void;
  /** Удалить строку */
  onDeleteRow: (rowId: string) => void;
  /** Обновить ячейку */
  onUpdateCell: (rowId: string, columnId: string, value: string | number | boolean) => void;
}

/**
 * Редактор данных таблицы — шапка с колонками и строки
 * @param props - Пропсы компонента
 * @returns JSX элемент редактора таблицы
 */
export function TableEditor({
  table,
  onAddColumn,
  onDeleteColumn,
  onAddRow,
  onDeleteRow,
  onUpdateCell,
}: TableEditorProps) {
  /** Режим добавления колонки */
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  /** Имя новой колонки */
  const [newColName, setNewColName] = useState('');
  /** Тип новой колонки */
  const [newColType, setNewColType] = useState<ColumnType>('text');

  /** Подтверждение добавления колонки */
  const handleAddColumn = () => {
    const name = newColName.trim();
    if (!name) return;
    onAddColumn({ name, type: newColType });
    setNewColName('');
    setNewColType('text');
    setIsAddingColumn(false);
  };

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {/* Заголовок таблицы */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{table.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {table.columns.length} кол. · {table.rows.length} строк
          </span>
        </div>
      </div>

      {/* Таблица данных */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 px-2">#</TableHead>
              {table.columns.map((col) => (
                <TableHead key={col.id} className="min-w-[120px]">
                  <div className="flex items-center gap-1 group">
                    <span className="truncate">{col.name}</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {col.type}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 ml-auto"
                      onClick={() => onDeleteColumn(col.id)}
                    >
                      <Trash2 className="h-2.5 w-2.5 text-destructive" />
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-24">
                {!isAddingColumn ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs gap-1"
                    onClick={() => setIsAddingColumn(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Колонка
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      placeholder="Имя"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddColumn();
                        if (e.key === 'Escape') setIsAddingColumn(false);
                      }}
                      className="h-6 text-xs w-20"
                    />
                    <Select value={newColType} onValueChange={(v) => setNewColType(v as ColumnType)}>
                      <SelectTrigger className="h-6 text-xs w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">text</SelectItem>
                        <SelectItem value="number">number</SelectItem>
                        <SelectItem value="boolean">bool</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" className="h-6 w-6" onClick={handleAddColumn}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell className="px-2 text-xs text-muted-foreground">
                  {idx + 1}
                </TableCell>
                {table.columns.map((col) => (
                  <TableCell key={col.id} className="p-1">
                    <CellInput
                      type={col.type}
                      value={row.cells[col.id]}
                      onChange={(val) => onUpdateCell(row.id, col.id, val)}
                    />
                  </TableCell>
                ))}
                <TableCell className="p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => onDeleteRow(row.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Кнопка добавления строки */}
      <div className="px-4 py-2 border-t border-border/50">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onAddRow}>
          <Plus className="h-3 w-3" />
          Строка
        </Button>
      </div>
    </div>
  );
}

/** Пропсы ячейки ввода */
interface CellInputProps {
  /** Тип колонки */
  type: ColumnType;
  /** Текущее значение */
  value: string | number | boolean | undefined;
  /** Обработчик изменения */
  onChange: (value: string | number | boolean) => void;
}

/**
 * Ячейка ввода — адаптируется под тип колонки
 * @param props - Пропсы компонента
 * @returns JSX элемент ячейки
 */
function CellInput({ type, value, onChange }: CellInputProps) {
  if (type === 'boolean') {
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
      </div>
    );
  }

  return (
    <Input
      type={type === 'number' ? 'number' : 'text'}
      value={value != null ? String(value) : ''}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(type === 'number' ? Number(raw) || 0 : raw);
      }}
      className="h-7 text-xs border-transparent hover:border-border focus:border-primary"
    />
  );
}
