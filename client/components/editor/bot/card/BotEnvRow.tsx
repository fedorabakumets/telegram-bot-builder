/**
 * @fileoverview Строка переменной окружения в панели
 * Отображает key=value с кнопками reveal, copy, меню действий
 * Поддерживает инлайн-редактирование с dirty state (pending changes)
 * @module components/editor/bot/card/BotEnvRow
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Braces, Eye, EyeOff, Copy } from 'lucide-react';
import { BotEnvRowMenu } from './BotEnvRowMenu';
import { BotEnvServerVarsPopover } from './BotEnvServerVarsPopover';

/** Свойства строки переменной */
interface BotEnvRowProps {
  /** ID переменной (null для системных) */
  id: number | null;
  /** Имя переменной */
  envKey: string;
  /** Значение (серверное) */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
  /** Системная переменная */
  isSystem: boolean;
  /** Значение подтянуто из серверного окружения (показывать как ${{KEY}}) */
  isServerRef?: boolean;
  /** Колбэк раскрытия секрета (для кастомных) */
  onReveal?: (id: number) => Promise<string>;
  /** Колбэк при изменении значения (dirty state) */
  onPendingChange?: (key: string, value: string, type: 'system' | 'custom', id?: number) => void;
  /** Колбэк удаления (для кастомных, прямая мутация) */
  onDelete?: (id: number) => void;
  /** Pending значение (если есть несохранённое изменение) */
  pendingValue?: string;
}

/**
 * Строка переменной окружения с поддержкой dirty state
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvRow({
  id, envKey, value, isSecret, isSystem, isServerRef, onReveal, onPendingChange, onDelete, pendingValue,
}: BotEnvRowProps) {
  /** Раскрытое значение секрета */
  const [revealed, setRevealed] = useState<string | null>(null);
  /** Режим инлайн-редактирования */
  const [editing, setEditing] = useState(false);
  /** Локальное значение при редактировании */
  const [editValue, setEditValue] = useState(value);

  /** Можно ли редактировать эту переменную */
  const canEdit = !!onPendingChange;

  /** Актуальное значение с учётом pending */
  const actualValue = pendingValue ?? value;

  /** Показать/скрыть секрет */
  async function handleToggleReveal() {
    if (revealed !== null) { setRevealed(null); return; }
    if (isServerRef) {
      // Для серверных ссылок — показываем имя переменной как ${{KEY}}
      setRevealed(`\${{${envKey}}}`);
    } else if (isSystem) {
      setRevealed(actualValue);
    } else if (id && onReveal) {
      const val = await onReveal(id);
      setRevealed(val);
    }
  }

  /** Сохранить инлайн-редактирование в pending */
  function handleSaveEdit() {
    if (onPendingChange) {
      onPendingChange(envKey, editValue, isSystem ? 'system' : 'custom', id ?? undefined);
    }
    setEditing(false);
  }

  /** Начать редактирование */
  function handleStartEdit() {
    // Для серверных ссылок — показываем ${{KEY}} вместо реального значения
    if (isServerRef) {
      setEditValue('');
    } else {
      setEditValue(revealed ?? actualValue);
    }
    setEditing(true);
  }

  /** Отображаемое значение */
  const displayValue = isServerRef && isSecret
    ? (revealed ?? `\${{${envKey}}}`)
    : isSecret
      ? (revealed ?? '••••••••')
      : actualValue;

  /** Подсветка строки при наличии pending изменения */
  const pendingHighlight = pendingValue !== undefined
    ? 'bg-amber-50/50 dark:bg-amber-950/20' : '';

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 group/row transition-colors ${pendingHighlight}`}>
      <Braces className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      <span className="text-xs font-mono font-medium text-foreground min-w-[80px] shrink-0">
        {envKey}
      </span>
      <span className="text-muted-foreground/50 text-xs">=</span>

      {editing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={handleSaveEdit}
            className="h-6 text-xs flex-1 min-w-0"
            autoFocus
          />
          <BotEnvServerVarsPopover onSelect={(val) => setEditValue(val)} />
        </div>
      ) : (
        <span
          className={`text-xs truncate flex-1 min-w-0 ${canEdit ? 'text-foreground/80 cursor-pointer' : 'text-muted-foreground/70'}`}
          onClick={() => { if (canEdit) handleStartEdit(); }}
          title={canEdit ? 'Нажмите для редактирования' : 'Только для чтения'}
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
      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/row:opacity-100" onClick={() => navigator.clipboard.writeText(revealed ?? actualValue)} title="Копировать">
        <Copy className="h-3 w-3" />
      </Button>

      {/* Меню действий */}
      <BotEnvRowMenu
        envKey={envKey}
        canEdit={canEdit}
        canDelete={!isSystem && !!id}
        onEdit={handleStartEdit}
        onDelete={id ? () => onDelete?.(id) : undefined}
      />
    </div>
  );
}
