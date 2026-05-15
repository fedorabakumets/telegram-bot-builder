/**
 * @fileoverview Строка переменной окружения в панели
 * Отображает key=value с кнопками reveal, copy, меню действий
 * @module components/editor/bot/card/BotEnvRow
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Braces, Eye, EyeOff, Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';

/** Свойства строки переменной */
interface BotEnvRowProps {
  /** ID переменной (null для системных) */
  id: number | null;
  /** Имя переменной */
  envKey: string;
  /** Значение (маскированное для секретов) */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
  /** Системная переменная (нередактируемая) */
  isSystem: boolean;
  /** Колбэк раскрытия секрета */
  onReveal?: (id: number) => Promise<string>;
  /** Колбэк обновления */
  onUpdate?: (id: number, value: string) => void;
  /** Колбэк удаления */
  onDelete?: (id: number) => void;
}

/**
 * Строка переменной окружения
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvRow({
  id, envKey, value, isSecret, isSystem, onReveal, onUpdate, onDelete,
}: BotEnvRowProps) {
  /** Раскрытое значение секрета */
  const [revealed, setRevealed] = useState<string | null>(null);
  /** Режим инлайн-редактирования */
  const [editing, setEditing] = useState(false);
  /** Локальное значение при редактировании */
  const [editValue, setEditValue] = useState(value);

  /** Показать/скрыть секрет */
  async function handleToggleReveal() {
    if (revealed !== null) { setRevealed(null); return; }
    if (id && onReveal) {
      const val = await onReveal(id);
      setRevealed(val);
    }
  }

  /** Копировать значение */
  function handleCopy() {
    const text = revealed ?? value;
    navigator.clipboard.writeText(text);
  }

  /** Сохранить инлайн-редактирование */
  function handleSaveEdit() {
    if (id && onUpdate) onUpdate(id, editValue);
    setEditing(false);
  }

  /** Отображаемое значение */
  const displayValue = isSecret ? (revealed ?? '••••••••') : value;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 group/row transition-colors">
      <Braces className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      <span className="text-xs font-mono font-medium text-foreground min-w-[80px] shrink-0">
        {envKey}
      </span>
      <span className="text-muted-foreground/50 text-xs">=</span>

      {editing && !isSystem ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
          onBlur={handleSaveEdit}
          className="h-6 text-xs flex-1 min-w-0"
          autoFocus
        />
      ) : (
        <span
          className={`text-xs truncate flex-1 min-w-0 ${isSystem ? 'text-muted-foreground/70' : 'text-foreground/80 cursor-pointer'}`}
          onClick={() => { if (!isSystem) { setEditValue(revealed ?? value); setEditing(true); } }}
          title={isSystem ? 'Системная переменная' : 'Нажмите для редактирования'}
        >
          {displayValue}
        </span>
      )}

      {/* Кнопка reveal для секретов */}
      {isSecret && (
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/row:opacity-100" onClick={handleToggleReveal} title="Показать/скрыть">
          {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
      )}

      {/* Кнопка копирования */}
      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/row:opacity-100" onClick={handleCopy} title="Копировать">
        <Copy className="h-3 w-3" />
      </Button>

      {/* Меню действий */}
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
          {!isSystem && id && (
            <>
              <DropdownMenuItem onClick={() => { setEditValue(revealed ?? value); setEditing(true); }}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(id)}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Удалить
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
