/**
 * @fileoverview Попап для вставки и редактирования гиперссылки
 * @description Позиционируется над выделением, содержит поле URL и кнопки подтверждения/удаления
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PopoverPosition } from '../hooks/useLinkPopover';

/**
 * Свойства компонента LinkPopover
 */
export interface LinkPopoverProps {
  /** Открыт ли попап */
  isOpen: boolean;
  /** Текущий URL (если редактируем существующую ссылку) */
  currentUrl: string;
  /** Позиция попапа на экране */
  position: PopoverPosition;
  /** Callback подтверждения URL */
  onApply: (url: string) => void;
  /** Callback удаления ссылки */
  onRemove: () => void;
  /** Callback закрытия попапа */
  onClose: () => void;
}

/**
 * Попап для ввода и редактирования URL гиперссылки
 * @param props - Свойства компонента
 * @returns JSX элемент попапа или null если закрыт
 */
export function LinkPopover({
  isOpen,
  currentUrl,
  position,
  onApply,
  onRemove,
  onClose
}: LinkPopoverProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронизируем поле с текущим URL при открытии
  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentUrl]);

  // Закрытие по клику вне попапа
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, onClose]);

  // Закрытие по Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter') { e.preventDefault(); onApply(url); }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', left: position.left, top: position.top, zIndex: 9999 }}
      className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-2 py-1.5"
    >
      <Input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://example.com"
        className="h-7 text-xs w-52 border-slate-300 dark:border-slate-600"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
        onClick={() => onApply(url)}
        title="Применить ссылку"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      {currentUrl && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onRemove}
          title="Удалить ссылку"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
