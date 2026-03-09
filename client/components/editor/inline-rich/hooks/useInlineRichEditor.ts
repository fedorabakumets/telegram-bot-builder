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
  /** Статистика текста */
  wordCount: number;
  charCount: number;
  /** Функции управления */
  undo: () => void;
  redo: () => void;
  applyFormatting: (format: any) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  copyFormatted: () => void;
  insertVariable: (name: string) => void;
  applyFilterToVariable: (variableName: string, filter: string) => void;
  handleInput: () => void;
  canUndo: boolean;
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
  const { undo, redo, saveToUndoStack } = useUndoRedo(
    props.value,
    props.onChange,
    toast
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

  const applyFilterToVariable = (variableName: string, filter: string) => {
    // Фильтры хранятся отдельно в состоянии InlineRichEditor
    // Эта функция теперь только для совместимости
    console.log(`Фильтр для ${variableName}: ${filter || 'нет'}`);
  };

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
    applyFilterToVariable,
    handleInput,
    canUndo: true,
    canRedo: true
  };
}
