/**
 * @fileoverview Компонент области редактора кода на основе Monaco Editor
 * @module components/editor/code/code-editor-area
 */

import { MutableRefObject } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

/**
 * Тип для Monaco Editor с минимальным интерфейсом, необходимым для нашего использования
 */
interface MonacoEditor {
  /** Получить действие редактора по идентификатору */
  getAction: (action: string) => { run: () => Promise<void> } | null;
  /** Установить фокус на редактор */
  focus: () => void;
  /** Получить текущее значение редактора */
  getValue: () => string;
  /** Установить значение редактора */
  setValue: (value: string) => void;
  /** Получить модель редактора */
  getModel: () => any;
  /** Обновить параметры редактора */
  updateOptions: (options: any) => void;
  /** Уничтожить экземпляр редактора */
  dispose: () => void;
}

/**
 * Тип для статистики кода
 */
interface CodeStats {
  /** Общее количество строк */
  totalLines: number;
  /** Флаг обрезки контента */
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
  /** Флаг мобильного устройства */
  isMobile: boolean;
  /** Флаг загрузки */
  isLoading: boolean;
  /** Отображаемый контент */
  displayContent: string;
  /** Выбранный формат кода */
  selectedFormat: string;
  /** Тема редактора */
  theme: string;
  /** Ссылка на экземпляр Monaco Editor */
  editorRef: MutableRefObject<MonacoEditor | null>;
  /** Статистика кода */
  codeStats: CodeStats;
  /** Функция изменения состояния сворачивания */
  setAreAllCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  /** Текущее состояние сворачивания */
  areAllCollapsed?: boolean;
  /** Флаг режима только для чтения (по умолчанию true) */
  readOnly?: boolean;
  /** Колбэк при изменении содержимого редактора */
  onChange?: (value: string) => void;
}

/**
 * Компонент области редактора кода
 * Отображает Monaco Editor с поддержкой режима только для чтения и редактирования
 * @param props - Свойства компонента
 * @returns JSX элемент
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
  readOnly = true,
  onChange,
}: CodeEditorAreaProps) {
  return <Card className="border border-border/50 shadow-sm overflow-hidden h-full flex flex-col">
    <CardContent className="p-0 flex-1 flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Генерация кода...</p>
          </div>
        </div>
      ) : (
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
          onChange={(value) => onChange?.(value ?? '')}
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
            readOnly,
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
            contextmenu: !readOnly,
            bracketPairColorization: {
              enabled: selectedFormat === 'json'
            },
            formatOnPaste: !readOnly,
            formatOnType: false
          }}
          data-testid={`monaco-editor-code-${selectedFormat}`}
        />
      )}
    </CardContent>
  </Card>;
}