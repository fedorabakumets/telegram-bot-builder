/**
 * @fileoverview Хук для управления логикой InlineRichEditor
 * @description Агрегирует все хуки редактора в один
 */

import { useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { InlineRichEditorProps } from '../types';
import { useTextStats } from './useTextStats';
import { useUndoRedo } from './useUndoRedo';
import { useEditorSync } from './useEditorSync';
import { useFormatting } from './useFormatting';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useVariableInsert } from './useVariableInsert';
import { useClipboard } from './useClipboard';
import { useEditorInput } from './useEditorInput';
import { useLinkPopover } from './useLinkPopover';
import type { UseLinkPopoverReturn } from './useLinkPopover';
import { useActiveFormats } from './useActiveFormats';
import { valueToHtml, htmlToValue } from '../html-converter';
import { formatOptions } from '../format-options';

/**
 * Результат работы хука useInlineRichEditor
 */
export interface UseInlineRichEditorReturn {
  /** Ref на DOM элемент редактора */
  editorRef: React.RefObject<HTMLDivElement>;
  /** Количество слов */
  wordCount: number;
  /** Количество символов */
  charCount: number;
  /** Функция отмены действия */
  undo: () => void;
  /** Функция повтора действия */
  redo: () => void;
  /** Функция применения форматирования */
  applyFormatting: (format: any) => void;
  /** Обработчик нажатия клавиш */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Функция копирования в буфер */
  copyFormatted: () => void;
  /** Функция вставки переменной */
  insertVariable: (name: string) => void;
  /** Обработчик ввода */
  handleInput: () => void;
  /** Доступен ли undo */
  canUndo: boolean;
  /** Доступен ли redo */
  canRedo: boolean;
  /** Данные попапа ссылки */
  linkPopover: UseLinkPopoverReturn;
  /** Набор активных команд форматирования в позиции курсора */
  activeFormats: Set<string>;
  /** Обработчик потери фокуса редактором — сохраняет выделение */
  saveSelectionOnBlur: () => void;
}

/**
 * Хук для управления логикой InlineRichEditor
 * @param props - Свойства редактора
 * @returns Объект с методами и состояниями редактора
 */
export function useInlineRichEditor(
  props: InlineRichEditorProps
): UseInlineRichEditorReturn {
  const isFormattingRef = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const setIsFormatting = useCallback((v: boolean) => { isFormattingRef.current = v; }, []);
  const { toast } = useToast();

  const { wordCount, charCount } = useTextStats(props.value);
  const { undo, redo, saveToUndoStack, undoStack, redoStack } = useUndoRedo(
    props.value,
    props.onChange
  );

  useEditorSync({
    editorRef,
    value: props.value,
    isFormattingRef,
    valueToHtml,
    enableMarkdown: props.enableMarkdown ?? false
  });

  const { handleInput } = useEditorInput({
    editorRef,
    htmlToValue,
    onChange: props.onChange,
    enableMarkdown: props.enableMarkdown ?? false,
    setIsFormatting
  });

  const linkPopover = useLinkPopover(handleInput);

  const { applyFormatting, saveSelectionOnBlur } = useFormatting({
    editorRef,
    saveToUndoStack,
    handleInput,
    toast,
    onFormatModeChange: props.onFormatModeChange,
    setIsFormatting,
    onLinkCommand: linkPopover.openLinkPopover
  });

  const { handleKeyDown } = useKeyboardShortcuts({
    applyFormatting,
    undo,
    redo,
    formatOptions,
    onLinkShortcut: linkPopover.openLinkPopover
  });

  const { copyFormatted } = useClipboard({ editorRef, toast });

  const { insertVariable } = useVariableInsert({
    editorRef,
    availableVariables: props.availableVariables ?? [],
    saveToUndoStack,
    handleInput,
    toast,
    onMediaVariableSelect: props.onMediaVariableSelect,
    setIsFormatting
  });

  const activeFormats = useActiveFormats(editorRef);

  return {
    editorRef,
    wordCount,
    charCount,
    undo,
    redo,
    applyFormatting,
    handleKeyDown,
    copyFormatted,
    insertVariable,
    handleInput,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    linkPopover,
    activeFormats,
    saveSelectionOnBlur
  };
}
