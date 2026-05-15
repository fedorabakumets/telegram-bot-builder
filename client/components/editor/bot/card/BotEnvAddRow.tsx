/**
 * @fileoverview Форма добавления новой переменной окружения
 * Инлайн-строка с полями KEY, VALUE, кнопками секрет/сохранить/отмена
 * @module components/editor/bot/card/BotEnvAddRow
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, LockOpen, Check, X } from 'lucide-react';

/** Свойства формы добавления переменной */
interface BotEnvAddRowProps {
  /** Колбэк при сохранении */
  onSave: (key: string, value: string, isSecret: number) => void;
  /** Колбэк при отмене */
  onCancel: () => void;
  /** Флаг загрузки (мутация в процессе) */
  isPending?: boolean;
}

/**
 * Инлайн-форма добавления новой переменной окружения
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvAddRow({ onSave, onCancel, isPending }: BotEnvAddRowProps) {
  /** Имя переменной */
  const [key, setKey] = useState('');
  /** Значение переменной */
  const [value, setValue] = useState('');
  /** Флаг секретности */
  const [isSecret, setIsSecret] = useState(false);

  /** Обработчик сохранения */
  function handleSave() {
    const trimmedKey = key.trim().toUpperCase();
    if (!trimmedKey) return;
    onSave(trimmedKey, value, isSecret ? 1 : 0);
  }

  /** Обработчик нажатия Enter */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="flex items-center gap-1.5 p-2 rounded-md border border-primary/30 bg-primary/5">
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="VARIABLE_NAME"
        className="h-7 text-xs font-mono flex-1 min-w-0"
        autoFocus
        disabled={isPending}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="значение"
        type={isSecret ? 'password' : 'text'}
        className="h-7 text-xs flex-1 min-w-0"
        disabled={isPending}
      />
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => setIsSecret(!isSecret)}
        title={isSecret ? 'Секрет (скрыто)' : 'Обычная (видна)'}
      >
        {isSecret
          ? <Lock className="h-3.5 w-3.5 text-amber-500" />
          : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
      </Button>
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 shrink-0 text-emerald-600"
        onClick={handleSave}
        disabled={!key.trim() || isPending}
        title="Сохранить"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 shrink-0 text-destructive"
        onClick={onCancel}
        disabled={isPending}
        title="Отмена"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
