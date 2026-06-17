/**
 * @fileoverview Компактный JSON-редактор node.data в панели свойств
 * @module components/editor/properties/components/main/node-data-json-editor
 */

import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/editor/header/utils/theme-provider';

/** Свойства компонента NodeDataJsonEditor */
interface NodeDataJsonEditorProps {
  /** Текущий черновик JSON */
  value: string;
  /** Текст ошибки парсинга или null */
  error: string | null;
  /** Колбэк изменения текста */
  onChange: (value: string) => void;
  /** Колбэк применения по Ctrl+S */
  onApply: () => void;
}

/**
 * Monaco-редактор для raw JSON объекта node.data
 * @param props - Свойства компонента
 * @returns JSX элемент редактора
 */
export function NodeDataJsonEditor({ value, error, onChange, onApply }: NodeDataJsonEditorProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  /** Ctrl+S — применить JSON */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onApply();
      }
    };
    const el = containerRef.current;
    el?.addEventListener('keydown', handler);
    return () => el?.removeEventListener('keydown', handler);
  }, [onApply]);

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-[240px]" tabIndex={-1}>
      {error && (
        <div
          className="mx-3 mt-3 px-3 py-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg shrink-0"
          role="alert"
          data-testid="properties-json-error"
        >
          {error}
        </div>
      )}
      <div className="flex-1 min-h-0 p-3">
        <Editor
          value={value}
          language="json"
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            readOnly: false,
            lineNumbers: 'on',
            wordWrap: 'on',
            fontSize: 12,
            lineHeight: 1.5,
            minimap: { enabled: false },
            folding: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            tabSize: 2,
          }}
          onChange={(v) => onChange(v ?? '')}
          data-testid="properties-node-data-json-editor"
        />
      </div>
      <p className="px-4 pb-3 text-[11px] text-muted-foreground shrink-0">
        Редактируется только <code className="font-mono">node.data</code>. Нажмите «Применить» или Ctrl+S.
      </p>
    </div>
  );
}
