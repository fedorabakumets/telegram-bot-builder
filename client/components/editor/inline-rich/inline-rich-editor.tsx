import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { InlineRichEditorProps } from './types';
import { formatOptions } from './format-options';
import { valueToHtml, htmlToValue } from './html-converter';
import { useTextStats } from './hooks/useTextStats';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useEditorSync } from './hooks/useEditorSync';
import { useFormatting } from './hooks/useFormatting';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useVariableInsert } from './hooks/useVariableInsert';
import { useClipboard } from './hooks/useClipboard';
import { EditorToolbar } from './components/EditorToolbar';
import { VariablesMenu } from './components/VariablesMenu';
import { EditorContent } from './components/EditorContent';
import { StatsBar } from './components/StatsBar';

/**
 * Компонент встроенного редактора с поддержкой форматирования текста
 * 
 * Предоставляет возможности:
 * - Форматирование текста (жирный, курсив, подчеркивание, зачеркивание)
 * - Вставка кода, цитат и заголовков
 * - Поддержка Markdown и HTML режимов
 * - Отмена/повтор действий
 * - Вставка переменных и медиапеременных
 * - Подсчет слов и символов
 * - Горячие клавиши для быстрого форматирования
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент редактора
 */
export function InlineRichEditor({
  value,
  onChange,
  placeholder = "Введите текст сообщения...",
  enableMarkdown = false,
  onFormatModeChange,
  availableVariables = [],
  onMediaVariableSelect
}: InlineRichEditorProps) {
  /** Флаг активного форматирования */
  const [isFormatting, setIsFormatting] = useState(false);
  /** Ссылка на DOM элемент редактора */
  const editorRef = useRef<HTMLDivElement>(null);
  /** Хук для показа уведомлений */
  const { toast } = useToast();
  /** Статистика текста */
  const { wordCount, charCount } = useTextStats(value);
  /** Управление отменой/повтором */
  const { undo, redo, saveToUndoStack } = useUndoRedo(value, onChange, toast);

  /** Синхронизация DOM редактора со значением */
  useEditorSync({ editorRef, value, isFormatting, valueToHtml, enableMarkdown });

  /** Обработчик ввода */
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setIsFormatting(true);
      const html = editorRef.current.innerHTML;
      const text = htmlToValue(html, enableMarkdown);
      onChange(text);
      setTimeout(() => setIsFormatting(false), 0);
    }
  }, [onChange, htmlToValue, enableMarkdown]);

  /** Применение форматирования */
  const { applyFormatting } = useFormatting({
    editorRef,
    saveToUndoStack,
    handleInput,
    toast,
    onFormatModeChange,
    setIsFormatting
  });

  /** Обработка горячих клавиш */
  const { handleKeyDown } = useKeyboardShortcuts({
    applyFormatting,
    undo,
    redo,
    formatOptions
  });

  /** Копирование в буфер */
  const { copyFormatted } = useClipboard({ editorRef, toast });

  /** Вставка переменных */
  const { insertVariable } = useVariableInsert({
    editorRef,
    availableVariables,
    saveToUndoStack,
    handleInput,
    toast,
    onMediaVariableSelect,
    setIsFormatting
  });

  const variablesMenu = (
    <VariablesMenu
      availableVariables={availableVariables}
      insertVariable={insertVariable}
    />
  );

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Панель инструментов */}
      <EditorToolbar
        formatOptions={formatOptions}
        applyFormatting={applyFormatting}
        undo={undo}
        redo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        copyFormatted={copyFormatted}
        variablesMenu={variablesMenu}
      />

      {/* Область редактора */}
      <EditorContent
        value={value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        innerRef={editorRef}
      >
        <StatsBar wordCount={wordCount} charCount={charCount} />
      </EditorContent>
    </div>
  );
}