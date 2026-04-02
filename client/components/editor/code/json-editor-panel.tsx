/**
 * @fileoverview Панель редактирования JSON с валидацией и кнопкой применения изменений
 * @module components/editor/code/json-editor-panel
 */

import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save } from 'lucide-react';

/**
 * Свойства компонента панели редактирования JSON
 */
interface JsonEditorPanelProps {
  /** Текущее значение JSON в виде строки */
  value: string;
  /** Тема редактора: 'dark' или 'light' */
  theme?: string;
  /** Колбэк, вызываемый при нажатии "Применить изменения" с валидным JSON */
  onApply: (json: string) => void;
}

/**
 * Панель редактирования JSON с Monaco Editor.
 * Валидирует JSON перед применением и показывает ошибку при невалидном вводе.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function JsonEditorPanel({ value, theme, onApply }: JsonEditorPanelProps) {
  /** Текущее значение в редакторе */
  const [editorValue, setEditorValue] = useState(value);
  /** Сообщение об ошибке валидации */
  const [error, setError] = useState<string | null>(null);

  /**
   * Обрабатывает нажатие кнопки "Применить изменения".
   * Валидирует JSON и вызывает onApply при успехе.
   */
  const handleApply = () => {
    try {
      JSON.parse(editorValue);
      setError(null);
      onApply(editorValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невалидный JSON');
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Предупреждение о raw-редактировании */}
      <div className="flex items-start gap-2 rounded-md border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>Прямое редактирование JSON. Некорректные изменения могут нарушить структуру проекта.</span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-[300px] rounded-md overflow-hidden border border-border/50">
        <Editor
          value={editorValue}
          language="json"
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          onChange={(val) => setEditorValue(val ?? '')}
          options={{
            readOnly: false,
            lineNumbers: 'on',
            wordWrap: 'on',
            fontSize: 12,
            minimap: { enabled: false },
            folding: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Ошибка валидации */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Кнопка применения */}
      <Button
        size="sm"
        className="w-full"
        onClick={handleApply}
        data-testid="button-apply-json"
      >
        <Save className="h-4 w-4 mr-1.5" />
        Применить изменения
      </Button>
    </div>
  );
}
