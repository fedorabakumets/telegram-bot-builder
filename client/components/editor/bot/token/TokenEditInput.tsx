/**
 * @fileoverview Компонент редактирования токена
 *
 * Поле ввода токена с валидацией, кнопками сохранения/отмены
 * и индикатором загрузки.
 *
 * @module TokenEditInput
 */

import { Loader2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Свойства компонента редактирования токена
 */
interface TokenEditInputProps {
  /** Текущее значение поля */
  value: string;
  /** Обработчик изменения значения */
  onChange: (value: string) => void;
  /** Обработчик нажатия клавиш */
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Обработчик сохранения */
  onSave: () => void;
  /** Обработчик отмены */
  onCancel: () => void;
  /** Флаг процесса валидации */
  isValidating: boolean;
  /** Текст ошибки или null */
  error: string | null;
}

/**
 * Компонент редактирования токена с кнопками сохранения и отмены
 */
export function TokenEditInput({
  value,
  onChange,
  onKeyDown,
  onSave,
  onCancel,
  isValidating,
  error,
}: TokenEditInputProps) {
  return (
    <div className="w-full space-y-1">
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          className={`font-mono text-xs flex-1 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          placeholder="Введите токен бота"
          disabled={isValidating}
          aria-label="Поле ввода токена бота"
          aria-invalid={!!error}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
          onClick={onSave}
          disabled={isValidating}
          aria-label="Сохранить токен"
        >
          {isValidating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onCancel}
          disabled={isValidating}
          aria-label="Отменить редактирование"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {isValidating && (
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Проверка токена...
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
