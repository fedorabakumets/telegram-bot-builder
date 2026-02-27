import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  RotateCw,
  Copy,
  Plus,
  Image,
  Video,
  Music,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
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

  /**
   * Копирует форматированный текст в буфер обмена
   */
  const copyFormatted = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      navigator.clipboard.writeText(html).then(() => {
        toast({
          title: "Скопировано",
          description: "Форматированный текст скопирован в буфер обмена",
          variant: "default"
        });
      });
    }
  }, [toast]);

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

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Modern Toolbar */}
      <div className="bg-gradient-to-r from-slate-50/60 to-slate-100/40 dark:from-slate-950/40 dark:to-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-lg p-2.5 sm:p-3 backdrop-blur-sm">
        <div className="flex flex-row flex-wrap items-center gap-2">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-slate-900/50 rounded-lg p-1.5 sm:p-2 border border-slate-200/50 dark:border-slate-800/50">
            {formatOptions.map((format) => (
              <Button
                key={format.command}
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting(format)}
                className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                title={`${format.name} (${format.shortcut})`}
              >
                <format.icon className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
              </Button>
            ))}
          </div>

          {/* History Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-slate-900/50 rounded-lg p-1.5 sm:p-2 border border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
              title="Отменить (Ctrl+Z)"
            >
              <RotateCcw className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
              title="Повторить (Ctrl+Shift+Z)"
            >
              <RotateCw className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={copyFormatted}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title="Копировать форматированный текст"
            >
              <Copy className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
            </Button>
          </div>

          {/* Variables Insert Button */}
          {availableVariables.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/20 hover:to-cyan-500/15 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/25 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all"
                  title="Вставить переменную"
                >
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Переменная</span>
                  <span className="sm:hidden">+ Переменная</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64">
                <DropdownMenuLabel className="text-xs sm:text-sm font-semibold">
                  📌 Доступные переменные
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableVariables.map((variable, index) => {
                  const getMediaIcon = () => {
                    switch (variable.mediaType) {
                      case 'photo': return <Image className="h-4 w-4 text-blue-500" />;
                      case 'video': return <Video className="h-4 w-4 text-purple-500" />;
                      case 'audio': return <Music className="h-4 w-4 text-green-500" />;
                      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
                      default: return null;
                    }
                  };

                  const getBadgeText = () => {
                    if (variable.mediaType) {
                      switch (variable.mediaType) {
                        case 'photo': return '🖼️ Фото';
                        case 'video': return '🎥 Видео';
                        case 'audio': return '🎵 Аудио';
                        case 'document': return '📄 Документ';
                      }
                    }
                    if (variable.nodeType === 'user-input') return '⌨️ Ввод';
                    if (variable.nodeType === 'start') return '▶️ Команда';
                    if (variable.nodeType === 'command') return '🔧 Команда';
                    if (variable.nodeType === 'system') return '⚙️ Система';
                    if (variable.nodeType === 'conditional') return '❓ Условие';
                    return '📌 Другое';
                  };

                  const mediaIcon = getMediaIcon();

                  return (
                    <DropdownMenuItem
                      key={`${variable.nodeId}-${variable.name}-${index}`}
                      onClick={() => insertVariable(variable.name)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center gap-2">
                          {mediaIcon && <span className="flex-shrink-0">{mediaIcon}</span>}
                          <code className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {`{${variable.name}}`}
                          </code>
                          <Badge variant="secondary" className="text-xs h-5 ml-auto">
                            {getBadgeText()}
                          </Badge>
                        </div>
                        {variable.description && (
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {variable.description}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                {availableVariables.length === 0 && (
                  <DropdownMenuItem disabled>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Нет доступных переменных
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative border border-slate-300/60 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-950 overflow-hidden transition-all hover:border-slate-400/80 dark:hover:border-slate-600/80 focus-within:ring-2 focus-within:ring-blue-500/50 dark:focus-within:ring-blue-500/30">
        {/* Placeholder */}
        {!value && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 text-slate-400 dark:text-slate-600 text-sm sm:text-base pointer-events-none font-medium">
            {placeholder}
          </div>
        )}

        {/* Editor */}
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

        {/* Stats Bar */}
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