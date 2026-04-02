/**
 * @fileoverview Компонент области редактора кода на базе Monaco Editor
 * Отображает сгенерированный код с подсветкой синтаксиса и поддержкой сворачивания
 */

import { MutableRefObject } from 'react';
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
}: CodeEditorAreaProps) {
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
              readOnly: true,
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
          />
        )}
      </CardContent>
    </Card>
  );
}
