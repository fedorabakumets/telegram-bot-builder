/**
 * @fileoverview Компонент области редактора кода на базе Monaco Editor
 * Отображает сгенерированный код с подсветкой синтаксиса и поддержкой сворачивания
 */

import { MutableRefObject, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

/**
 * Минимальный интерфейс Monaco Editor для нашего использования
 */
interface MonacoEditor {
  /** Получить действие редактора по ID */
  getAction: (action: string) => { run: () => Promise<void> } | null;
  /** Установить фокус на редактор */
  focus: () => void;
  /** Получить текущее значение */
  getValue: () => string;
  /** Установить значение */
  setValue: (value: string) => void;
  /** Получить модель редактора */
  getModel: () => any;
  /** Обновить настройки */
  updateOptions: (options: any) => void;
  /** Уничтожить редактор */
  dispose: () => void;
}

/**
 * Статистика кода для отображения
 */
interface CodeStats {
  /** Общее количество строк */
  totalLines: number;
  /** Признак обрезки контента */
  truncated: boolean;
  /** Количество функций */
  functions: number;
  /** Количество классов */
  classes: number;
  /** Количество комментариев */
  comments: number;
}

/**
 * Свойства компонента области редактора кода
 */
interface CodeEditorAreaProps {
  /** Признак мобильного устройства */
  isMobile: boolean;
  /** Состояние загрузки */
  isLoading: boolean;
  /** Отображаемый контент */
  displayContent: string;
  /** Выбранный формат кода */
  selectedFormat: string;
  /** Тема оформления */
  theme: string;
  /** Ссылка на экземпляр редактора */
  editorRef: MutableRefObject<MonacoEditor | null>;
  /** Статистика кода */
  codeStats: CodeStats;
  /** Функция изменения состояния сворачивания */
  setAreAllCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  /** Текущее состояние сворачивания */
  areAllCollapsed?: boolean;
  /** Колбэк изменения контента (только для редактируемых форматов) */
  onContentChange?: (value: string) => void;
}

/**
 * Компонент области редактора кода
 * @param props - Свойства компонента
 * @returns JSX элемент редактора
 */
export function CodeEditorArea({
  isLoading,
  displayContent,
  selectedFormat,
  theme,
  editorRef,
  codeStats,
  setAreAllCollapsed,
  areAllCollapsed,
  onContentChange,
}: CodeEditorAreaProps) {
  /** Показывать ли подсказку-оверлей (только для JSON, пока не кликнули) */
  const [showHint, setShowHint] = useState(true);

  // Сбрасываем подсказку при смене формата
  useEffect(() => {
    setShowHint(true);
  }, [selectedFormat]);

  /**
   * Обрабатывает клик по оверлею — скрывает подсказку и фокусирует редактор
   */
  const handleHintClick = () => {
    setShowHint(false);
    setTimeout(() => editorRef.current?.focus(), 50);
  };

  // Реагируем на изменение состояния сворачивания извне
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (selectedFormat !== 'python' && selectedFormat !== 'json') return;
    if (areAllCollapsed) {
      editor.getAction('editor.foldAll')?.run();
    } else {
      editor.getAction('editor.unfoldAll')?.run();
    }
  }, [areAllCollapsed, selectedFormat]);

  return (
    <Card className="border border-border/50 shadow-sm overflow-hidden h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Генерация кода...</p>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 h-full">
            {selectedFormat === 'json' && showHint && (
              <div
                onClick={handleHintClick}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 cursor-text bg-background/60 backdrop-blur-[2px] transition-opacity"
              >
                <i className="fas fa-code text-2xl text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center px-6 leading-relaxed">
                  Здесь хранится структура сценария бота.<br />
                  Отредактируйте JSON и нажмите <span className="font-medium text-foreground">«Применить»</span>.
                </p>
                <p className="text-xs text-muted-foreground/60">Нажмите чтобы начать редактирование</p>
              </div>
            )}
            <Editor
              value={displayContent}
              language={
                selectedFormat === 'python' ? 'python' :
                selectedFormat === 'json' ? 'json' :
                selectedFormat === 'readme' ? 'markdown' :
                selectedFormat === 'dockerfile' ? 'dockerfile' :
                selectedFormat === 'config' ? 'yaml' :
                selectedFormat === 'env' ? 'shell' :
                'plaintext'
              }
              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
              onMount={(editor) => {
                editorRef.current = editor;
                if ((selectedFormat === 'python' || selectedFormat === 'json') && codeStats.totalLines > 0) {
                  const currentCollapseState = areAllCollapsed;
                  setTimeout(() => {
                    if (currentCollapseState) {
                      editor.getAction('editor.foldAll')?.run();
                    } else {
                      editor.getAction('editor.unfoldAll')?.run();
                    }
                    setAreAllCollapsed(!!currentCollapseState);
                  }, 100);
                }
              }}
              options={{
                readOnly: selectedFormat !== 'json',
                lineNumbers: 'on',
                wordWrap: 'on',
                fontSize: 12,
                lineHeight: 1.5,
                minimap: { enabled: codeStats.totalLines > 500 },
                folding: true,
                foldingHighlight: true,
                foldingStrategy: 'auto',
                showFoldingControls: 'always',
                glyphMargin: true,
                scrollBeyondLastLine: false,
                padding: { top: 8, bottom: 8 },
                automaticLayout: true,
                contextmenu: false,
                bracketPairColorization: { enabled: selectedFormat === 'json' },
                formatOnPaste: false,
                formatOnType: false,
              }}
              data-testid={`monaco-editor-code-${selectedFormat}`}
              onChange={(value) => {
                if (selectedFormat === 'json') {
                  setShowHint(false);
                  onContentChange?.(value ?? '');
                }
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
