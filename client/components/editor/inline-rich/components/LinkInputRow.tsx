/**
 * @fileoverview Inline-строка ввода гиперссылки
 * @description Появляется между тулбаром и редактором, без position:fixed и Portal
 */

import { useEffect, useRef, useState } from 'react';
import { Link, Check, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Свойства компонента LinkInputRow
 */
export interface LinkInputRowProps {
  /** Открыта ли строка ввода */
  isOpen: boolean;
  /** Текущий URL (если редактируем существующую ссылку) */
  currentUrl: string;
  /** Callback подтверждения URL */
  onApply: (url: string) => void;
  /** Callback удаления ссылки */
  onRemove: () => void;
  /** Callback закрытия строки */
  onClose: () => void;
}

/**
 * Inline-строка ввода URL гиперссылки.
 * Рендерится прямо в потоке документа — никакого Portal, никакого position:fixed.
 * @param props - Свойства компонента
 * @returns JSX элемент строки или null если закрыта
 */
export function LinkInputRow({
  isOpen,
  currentUrl,
  onApply,
  onRemove,
  onClose
}: LinkInputRowProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /** Синхронизируем поле с currentUrl и фокусируем инпут при открытии */
  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentUrl]);

  /** Enter — применяет ссылку, Escape — закрывает строку */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter') { e.preventDefault(); onApply(url); }
  };

  if (!isOpen) return null;

  return (
    <div className="flex items-center gap-2 px-1 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 dark:bg-blue-900/10">
      {/* Иконка ссылки слева */}
      <Link className="h-4 w-4 text-blue-400 shrink-0" />

      {/* Поле ввода URL */}
      <Input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://example.com"
        className="h-7 text-xs flex-1 bg-transparent border-slate-600/50 focus:border-blue-500/50"
      />

      {/* Кнопка применить */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10 shrink-0"
        onClick={() => onApply(url)}
        title="Применить ссылку"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>

      {/* Кнопка удалить ссылку — только если редактируем существующую */}
      {currentUrl && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
          onClick={onRemove}
          title="Удалить ссылку"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Кнопка закрыть */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 shrink-0"
        onClick={onClose}
        title="Закрыть"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
