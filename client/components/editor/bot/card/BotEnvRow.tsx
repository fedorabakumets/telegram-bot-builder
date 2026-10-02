/**
 * @fileoverview Строка переменной окружения в панели
 * Отображает key=value с кнопками reveal, copy, меню действий
 * Поддерживает инлайн-редактирование с dirty state (pending changes)
 * @module components/editor/bot/card/BotEnvRow
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Copy, Lock } from 'lucide-react';
import { cn } from '@/utils/utils';
import { BotEnvRowMenu } from './BotEnvRowMenu';
import { BotEnvServerVarsPopover } from './BotEnvServerVarsPopover';
import { BotEnvValueView } from './BotEnvValueView';

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
  /** Флаг: не закрывать editing при blur (клик по кнопке внутри контейнера) */
  const skipBlurRef = useRef(false);

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

  /**
   * Сохранить инлайн-редактирование в pending.
   * Маску секрета (•••• / botId:••••) и неизменённое значение не пишем —
   * иначе env-batch мог затереть реальный BOT_TOKEN в БД.
   */
  function handleSaveEdit() {
    const next = editValue;
    const isMaskedSecret = isSecret && (
      next.includes('•') || next.includes('*') || next.includes('…')
      || (!revealed && next === actualValue && /:•+$/.test(actualValue))
    );
    const unchanged = next === (revealed ?? actualValue)
      || (pendingValue !== undefined && next === pendingValue);
    if (onPendingChange && !isMaskedSecret && !unchanged) {
      onPendingChange(envKey, next, isSystem ? 'system' : 'custom', id ?? undefined);
    }
    setEditing(false);
  }

  /** Начать редактирование */
  function handleStartEdit() {
    // Для серверных ссылок — показываем ${{KEY}} как placeholder-значение
    if (isServerRef) {
      setEditValue(`\${{${envKey}}}`);
    } else if (isSecret && !revealed && (actualValue.includes('•') || actualValue.includes('*'))) {
      // Маскированный секрет не подставляем в инпут — пользователь вводит новое значение
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

  const masked = isSecret && !isServerRef && revealed === null;
  const actionBtn = 'h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-background hover:text-foreground';

  return (
    <div className={cn(
      'group/row flex flex-col gap-1.5 px-3 py-2 transition-colors hover:bg-muted/40',
      '@[24rem]:flex-row @[24rem]:items-center @[24rem]:gap-3',
      pendingValue !== undefined && 'border-l-2 border-l-amber-400 bg-amber-500/[0.08]',
    )}>
      <span className="inline-flex min-w-0 items-center gap-1 font-mono text-[11px] font-medium tracking-tight text-foreground @[24rem]:w-[42%] @[24rem]:shrink-0" title={envKey}>
        {!canEdit && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
        <span className="truncate">{envKey}</span>
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-1">
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={() => { if (!skipBlurRef.current) handleSaveEdit(); skipBlurRef.current = false; }}
            className="h-8 min-w-0 flex-1 rounded-md text-xs"
            autoFocus
          />
          <div onMouseDown={() => { skipBlurRef.current = true; }}>
            <BotEnvServerVarsPopover onSelect={(val) => setEditValue(val)} />
          </div>
        </div>
      ) : (
        <span
          className={cn('flex min-h-8 min-w-0 flex-1 items-center', canEdit && 'cursor-text')}
          onClick={() => { if (canEdit) handleStartEdit(); }}
          title={masked ? (canEdit ? 'Нажмите, чтобы изменить' : 'Только для чтения') : displayValue}
        >
          <BotEnvValueView displayValue={displayValue} masked={masked} isServerRef={!!isServerRef} />
        </span>
      )}

      <div className="flex shrink-0 items-center">
        {isSecret && (
          <Button variant="ghost" size="icon" className={actionBtn} onClick={handleToggleReveal} title="Показать/скрыть">
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className={actionBtn} onClick={() => navigator.clipboard.writeText(revealed ?? actualValue)} title="Копировать">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <BotEnvRowMenu
          envKey={envKey}
          canEdit={canEdit}
          canDelete={!isSystem && !!id}
          onEdit={handleStartEdit}
          onDelete={id ? () => onDelete?.(id) : undefined}
        />
      </div>
    </div>
  );
}
