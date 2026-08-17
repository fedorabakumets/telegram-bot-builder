/**
 * @fileoverview Кнопка вставки файла из буфера. Clipboard API часто запрещён —
 * тогда ждём Ctrl+V (событие paste не требует разрешения read).
 * @module components/editor/files/panel/file-clipboard-button
 */

import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  filesFromClipboardEvent,
  isClipboardDenied,
  isPasteHotkey,
  readClipboardFiles,
} from './read-clipboard-files';

/** Сколько ждать Ctrl+V после отказа Clipboard API */
const AWAIT_PASTE_MS = 15_000;

/** Пропсы кнопки вставки из буфера */
export interface FileClipboardButtonProps {
  /** Идёт ли загрузка — блокирует кнопку */
  disabled?: boolean;
  /** Передать выбранные из буфера файлы в загрузчик */
  onFiles: (files: File[]) => void;
}

/**
 * Кнопка «Из буфера»: скриншот или файл. При запрете API просит Ctrl+V.
 * @param props - Флаг блокировки и колбэк файлов
 * @returns JSX кнопки
 */
export function FileClipboardButton({
  disabled = false,
  onFiles,
}: FileClipboardButtonProps): React.JSX.Element {
  const { toast } = useToast();
  const catcherRef = useRef<HTMLDivElement>(null);
  const [awaitingPaste, setAwaitingPaste] = useState(false);

  useEffect(() => {
    if (!awaitingPaste) return undefined;
    const timer = window.setTimeout(() => setAwaitingPaste(false), AWAIT_PASTE_MS);
    catcherRef.current?.focus();
    return () => window.clearTimeout(timer);
  }, [awaitingPaste]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (disabled) return;
      const el = event.target as HTMLElement | null;
      const inField = el?.closest('input, textarea, [contenteditable="true"]');
      const inCatcher = el?.closest('[data-clipboard-catcher]');
      if (inField && !inCatcher && !awaitingPaste) return;
      const files = filesFromClipboardEvent(event);
      if (files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      setAwaitingPaste(false);
      onFiles(files);
    };
    document.addEventListener('paste', onPaste, true);
    return () => document.removeEventListener('paste', onPaste, true);
  }, [awaitingPaste, disabled, onFiles]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (disabled || !isPasteHotkey(event)) return;
      const el = event.target as HTMLElement | null;
      const inCatcher = el?.closest('[data-clipboard-catcher]');
      const inField = el?.closest('input, textarea, [contenteditable="true"]');
      if (inField && !inCatcher) return;
      catcherRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [disabled]);

  /**
   * Пробует Clipboard API; если браузер запретил — ждёт Ctrl+V.
   * @returns Promise<void>
   */
  const handleClick = async (): Promise<void> => {
    try {
      const files = await readClipboardFiles();
      if (files.length === 0) {
        toast({
          title: 'В буфере нет файла',
          description: 'Скопируйте скриншот и нажмите Ctrl+V или Ctrl+М',
        });
        setAwaitingPaste(true);
        return;
      }
      onFiles(files);
    } catch (error) {
      setAwaitingPaste(true);
      toast({
        title: 'Нажмите Ctrl+V или Ctrl+М',
        description: isClipboardDenied(error)
          ? 'Браузер не даёт читать буфер напрямую — вставьте сочетанием клавиш'
          : 'Вставьте скриншот или файл: Ctrl+V, Ctrl+М или Shift+Insert',
      });
    }
  };

  return (
    <>
      <div
        ref={catcherRef}
        data-clipboard-catcher="true"
        contentEditable
        tabIndex={-1}
        className="sr-only"
        aria-hidden
      />
      <Button
        type="button"
        variant={awaitingPaste ? 'default' : 'outline'}
        size="sm"
        className="h-8"
        disabled={disabled}
        onClick={() => void handleClick()}
        title="Вставить из буфера: Ctrl+V, Ctrl+М или Shift+Insert"
        data-testid="file-storage-upload-clipboard"
      >
        <ClipboardPaste className="h-3.5 w-3.5 sm:mr-1.5" />
        <span className="hidden sm:inline">{awaitingPaste ? 'Ctrl+V / М' : 'Из буфера'}</span>
      </Button>
    </>
  );
}
