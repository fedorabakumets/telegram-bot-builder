/**
 * @fileoverview Хук для управления логикой InlineRichEditor
 * @description Агрегирует все хуки редактора в один
 */

import { useState, useRef } from 'react';
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
import { valueToHtml, htmlToValue } from '../html-converter';
import { formatOptions } from '../format-options';

/**
 * Результат работы хука useInlineRichEditor
 */
export interface UseInlineRichEditorReturn {
  /** Ref на DOM элемент редактора */
  editorRef: React.RefObject<HTMLDivElement>;
  /** Флаг активного форматирования */
  isFormatting: boolean;
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
}

/**
 * Хук для управления логикой InlineRichEditor
 * @param props - Свойства редактора
 * @returns Объект с методами и состояниями редактора
 */
export function useInlineRichEditor(
  props: InlineRichEditorProps
): UseInlineRichEditorReturn {
  const [isFormatting, setIsFormatting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { wordCount, charCount } = useTextStats(props.value);
  const { undo, redo, saveToUndoStack, undoStack, redoStack } = useUndoRedo(
    props.value,
    props.onChange
  );

  useEditorSync({
    editorRef,
    value: props.value,
    isFormatting,
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

  const { applyFormatting } = useFormatting({
    editorRef,
    saveToUndoStack,
    handleInput,
    toast,
    onFormatModeChange: props.onFormatModeChange,
    setIsFormatting
  });

  const { handleKeyDown } = useKeyboardShortcuts({
    applyFormatting,
    undo,
    redo,
    formatOptions
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

  return {
    editorRef,
    isFormatting,
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
    canRedo: redoStack.length > 0
  };
}
