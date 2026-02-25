/**
 * @fileoverview Поле ввода токена с валидацией
 *
 * Компонент отображает поле для ввода токена с индикатором валидации.
 *
 * @module TokenInputField
 */

import { Input } from '@/components/ui/input';

interface TokenInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  isValidating: boolean;
  error: string | null;
}

/**
 * Поле ввода токена с валидацией
 */
export function TokenInputField({
  value,
  onChange,
  onKeyDown,
  onBlur,
  isValidating,
  error
}: TokenInputFieldProps) {
  return (
    <div className="w-full space-y-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoFocus
        className="font-mono text-xs p-2"
        placeholder="Введите токен бота"
        disabled={isValidating}
      />
      {isValidating && (
        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-spin" />
          Проверка токена...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
