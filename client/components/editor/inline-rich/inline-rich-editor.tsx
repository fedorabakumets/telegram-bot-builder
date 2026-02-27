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
      <div className="relative border border-slate-300/60 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-950 overflow-hidden transition-all hover:border-slate-400/80 dark:hover:border-slate-600/80 focus-within:ring-2 focus-within:ring-blue-500/50 dark:focus-within:ring-blue-500/30">
        {/* Placeholder */}
        {!value && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 text-slate-400 dark:text-slate-600 text-sm sm:text-base pointer-events-none font-medium">
            {placeholder}
          </div>
        )}

        {/* Редактируемая область */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] sm:min-h-[140px] p-3 sm:p-4 w-full text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none whitespace-pre-wrap selection:bg-blue-200 dark:selection:bg-blue-900"
          style={{
            lineHeight: '1.6',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
          data-placeholder={placeholder}
        />

        {/* Панель статистики */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            <i className="fas fa-align-left mr-1 sm:mr-1.5"></i>
            <span className="hidden sm:inline">{wordCount} слов</span>
            <span className="sm:hidden">{wordCount}</span>
          </span>
          <div className="w-px h-3 bg-slate-300/30 dark:bg-slate-700/30"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            <i className="fas fa-font mr-1 sm:mr-1.5"></i>
            <span className="hidden sm:inline">{charCount} символов</span>
            <span className="sm:hidden">{charCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}